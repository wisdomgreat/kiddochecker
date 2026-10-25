const base = 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
const jwt = require('./node_modules/jsonwebtoken');
const token = jwt.sign({ role: 'admin', email: 'admin@kiddochecker.com' }, 'kiddochecker-super-secret-2026');

async function assignClasses() {
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

  // 1. Fetch all classes
  const classRes = await fetch(base + '/api/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ table: 'classes', select: '*' })
  });
  const { data: classes } = await classRes.json();
  console.log('Available Classes:', classes.map(c => `${c.name} (id: ${c.id})`));

  // Map classes by age target
  const nurseryClass = classes.find(c => c.name.includes('Nursery')) || classes[0];
  const preschoolClass = classes.find(c => c.name.includes('Preschool')) || classes[0];
  const primaryCampClass = classes.find(c => c.name.includes('Primary Campers') || c.name.includes('6-8')) || classes[0];
  const juniorCampClass = classes.find(c => c.name.includes('Junior Campers') || c.name.includes('9-12')) || classes[0];
  const teensClass = classes.find(c => c.name.includes('Teens') || c.name.includes('13+')) || classes[0];

  // 2. Fetch all children
  const kidsRes = await fetch(base + '/api/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ table: 'children', select: 'id, first_name, last_name, age, class_id' })
  });
  const { data: kids } = await kidsRes.json();
  console.log(`Found ${kids.length} children.`);

  let updatedCount = 0;
  for (const child of kids) {
    const age = child.age != null ? Number(child.age) : 7; // Default 7 if age unknown
    let targetClass = primaryCampClass;

    if (age <= 3) {
      targetClass = nurseryClass;
    } else if (age <= 5) {
      targetClass = preschoolClass;
    } else if (age <= 8) {
      targetClass = primaryCampClass;
    } else if (age <= 12) {
      targetClass = juniorCampClass;
    } else {
      targetClass = teensClass;
    }

    // Always assign the appropriate age-matched class
    const updateRes = await fetch(base + '/api/mutate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        table: 'children',
        action: 'update',
        data: { class_id: targetClass.id },
        filters: [{ column: 'id', value: child.id, operator: '=' }]
      })
    });
    const updateData = await updateRes.json();
    if (updateData.success || !updateData.error) {
      updatedCount++;
      console.log(`✓ [${child.first_name} ${child.last_name}] (Age: ${child.age}) -> Assigned: ${targetClass.name}`);
    } else {
      console.error(`✗ Error updating ${child.first_name}:`, updateData);
    }
  }

  console.log(`\n🎉 Class Assignment Complete! Assigned ${updatedCount}/${kids.length} children.`);
}

assignClasses();
