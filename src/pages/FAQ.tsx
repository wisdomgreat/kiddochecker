
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What is KidCheck?",
    answer: "KidCheck is a secure child check-in and check-out system designed for churches, schools, childcare centers, and other organizations that serve children. It helps streamline the process of checking children in and out while maintaining security and safety.",
    category: "general"
  },
  {
    id: 2,
    question: "How does the check-in process work?",
    answer: "Parents or guardians can check in their children using a kiosk or mobile device. They enter their phone number or scan a QR code, select which children they're checking in, choose the appropriate class or event, and receive security tags for pickup.",
    category: "usage"
  },
  {
    id: 3,
    question: "Is my child's information secure?",
    answer: "Yes, we take security very seriously. All data is encrypted both in transit and at rest. We implement strict access controls and follow industry best practices for data security and privacy compliance.",
    category: "security"
  },
  {
    id: 4,
    question: "How do I set up KidCheck for my organization?",
    answer: "Setting up KidCheck is easy. After creating an admin account, you'll go through a simple step-by-step process to configure your organization details, add classes, set up check-in stations, and invite staff members.",
    category: "setup"
  },
  {
    id: 5,
    question: "Can I use KidCheck on multiple devices?",
    answer: "Yes, KidCheck is designed to work across multiple devices. You can set up dedicated check-in kiosks or allow staff to use tablets or computers. The system synchronizes data in real-time across all devices.",
    category: "usage"
  },
  {
    id: 6,
    question: "What happens if a parent loses their security tag?",
    answer: "If a parent loses their security tag, staff with appropriate permissions can verify the parent's identity through alternate means, such as checking ID or confirming security questions, and then manually complete the checkout process.",
    category: "usage"
  },
  {
    id: 7,
    question: "How do allergies and special notes work?",
    answer: "KidCheck allows parents to add allergies, medical conditions, and special notes to their child's profile. These are prominently displayed during check-in, on name tags, and in the classroom roster to ensure all staff are aware.",
    category: "features"
  },
  {
    id: 8,
    question: "Can I generate attendance reports?",
    answer: "Yes, KidCheck offers comprehensive reporting features. You can generate attendance reports by date range, class, event, or individual child. These reports can be exported for record-keeping or analysis.",
    category: "features"
  },
];

const FAQ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const categories = [
    { id: "all", name: "All Questions" },
    { id: "general", name: "General" },
    { id: "usage", name: "Usage" },
    { id: "security", name: "Security" },
    { id: "setup", name: "Setup" },
    { id: "features", name: "Features" },
  ];
  
  const toggleItem = (id: number) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter(item => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };
  
  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/landing")}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
        
        {/* Search and filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div
                  className={`p-4 flex justify-between items-center cursor-pointer ${
                    openItems.includes(item.id) ? "bg-gray-50" : ""
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <h3 className="font-medium text-lg">{item.question}</h3>
                  <span>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </span>
                </div>
                
                {openItems.includes(item.id) && (
                  <CardContent className="pt-0 border-t">
                    <p className="text-gray-700">{item.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No FAQ items match your search.</p>
            </div>
          )}
        </div>
        
        {/* Contact section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h2>
          <p className="text-gray-700 mb-4">
            Our support team is here to help with any additional questions you may have.
          </p>
          <Button onClick={() => navigate("/contact-us")}>Contact Support</Button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
