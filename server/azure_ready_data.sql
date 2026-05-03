SET session_replication_role = 'replica';

SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activity_logs" ("id", "user_id", "action", "resource", "resource_id", "details", "ip_address", "user_agent", "created_at") VALUES
	('60f64c46-0020-4a01-b74e-2a89541ceb90', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'verify_staff', 'user_roles', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', '{"notes": null, "action": "approved"}', NULL, NULL, '2026-03-09 23:24:32.836889+00'),
	('0c97fd62-b58b-4cec-adcd-639933ab41e0', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'verify_staff', 'user_roles', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', '{"notes": null, "action": "approved"}', NULL, NULL, '2026-03-16 01:29:46.328153+00');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."classes" ("id", "name", "description", "age_range", "room", "capacity", "created_at", "updated_at", "min_age", "max_age") VALUES
	('1a033672-21e8-416a-a039-26bf26a8f08a', 'Purity', '', '6-10', '102', 20, '2026-03-10 00:43:55.072292+00', '2026-05-01 13:54:27.080273+00', 6, 10),
	('72984069-6f33-4505-a672-287cfa967323', 'Dem 1', 'Salvation and Purity Class', '1-5', 'ROOM 101', 10, '2025-07-06 16:49:32.114957+00', '2026-05-01 13:54:27.080273+00', 1, 5);


--
-- Data for Name: families; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."children" ("id", "parent_id", "first_name", "last_name", "age", "allergies", "notes", "created_at", "updated_at", "family_id", "emergency_contact_name", "emergency_contact_phone", "medical_info", "has_guardian_approval", "class_id", "photo_url", "youth_pin", "allow_self_check", "points_balance") VALUES
	('a6e9ed82-dcfc-4de2-a486-fe5779f4f428', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Joh', 'Ade', 3, 'Peanut, eggs', '', '2026-02-25 02:02:06.996173+00', '2026-03-10 03:52:33.321745+00', NULL, 'Jane Doe', '555-01995645', 'None', false, '72984069-6f33-4505-a672-287cfa967323', NULL, NULL, false, 0),
	('5912411d-56c1-40bc-8b15-4286409eb760', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Junior', 'User', 5, 'Peanut, Water(cold), Soda', '', '2026-03-07 13:25:34.252212+00', '2026-03-10 04:12:53.382334+00', NULL, 'Test User', '5551234567', 'In case of Emergency please call 911 and then me', false, '72984069-6f33-4505-a672-287cfa967323', NULL, NULL, false, 0),
	('9b0c41e3-c31b-4432-a8ef-21f47daf9e13', 'beeb1e9b-0cc2-4570-8f4e-89b57f682d23', 'Justin', 'Goss', 6, '', '', '2026-03-15 19:55:24.444516+00', '2026-03-15 19:55:24.444516+00', NULL, 'Jon Goss', '6472999725', '', false, '1a033672-21e8-416a-a039-26bf26a8f08a', '', '', false, 0),
	('ca978de3-d492-4ec1-95d1-5c47f6b2d278', '900c5e2a-5622-4a7f-be84-f1961c6a5fd6', 'Kevin', 'Tester', 5, 'Peanuts', '', '2026-03-25 23:55:02.62824+00', '2026-03-25 23:55:02.62824+00', NULL, '', '5550199', '', false, '72984069-6f33-4505-a672-287cfa967323', '', '', false, 0),
	('f84b51db-4468-4e33-8cb0-9921259def9f', '93dfa015-046c-4380-b2c4-f0b8d8844f2c', 'Tester', 'Tester', 5, 'None', '', '2026-03-30 03:20:23.935291+00', '2026-03-30 03:20:23.935291+00', NULL, 'QA Test Parent', '5551234', '', false, '72984069-6f33-4505-a672-287cfa967323', '', '', false, 0),
	('4c3e424e-3cf9-4c94-b7c7-33570de141d4', '4f102c68-f2d1-4111-90cb-4e587ede99ee', 'Marianne', 'Dubon', 9, '', '', '2026-04-29 23:51:49.89859+00', '2026-04-29 23:51:49.89859+00', NULL, '', '4168307753', '', false, '1a033672-21e8-416a-a039-26bf26a8f08a', '', '', false, 0),
	('bb83d489-c141-4140-a18f-c9820564ebf1', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'Daramola', 'Balogun', 12, 'Peanut, Egg, Heart Palputation', '', '2025-08-02 19:03:26.37608+00', '2026-05-01 12:45:59.758008+00', NULL, 'Wisdom', '6478494317', 'In case of an emergency reach out to me', false, '72984069-6f33-4505-a672-287cfa967323', 'https://pxqztqcukuilqdermblq.supabase.co/storage/v1/object/public/avatars/h3eagqynohv_1773190585054.jpeg', '', false, 0),
	('ba14ff58-fd5a-4a95-b934-dc086f841d90', 'ae6f6dfc-fb82-499e-ae12-17da9ad6ef30', 'Kiosk', 'Kid', 5, '', '', '2026-03-07 16:30:51.141285+00', '2026-05-01 13:54:27.080273+00', NULL, 'Test Contact', '5550000000', '', false, '72984069-6f33-4505-a672-287cfa967323', NULL, NULL, false, 0),
	('d0334d01-498b-4d5e-b520-15468fc9ffba', 'ae6f6dfc-fb82-499e-ae12-17da9ad6ef30', 'Trigger', 'Test', 7, NULL, NULL, '2026-05-01 13:55:20.654986+00', '2026-05-01 13:55:20.654986+00', NULL, NULL, NULL, NULL, false, '1a033672-21e8-416a-a039-26bf26a8f08a', NULL, NULL, false, 0);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."attendance" ("id", "child_id", "class_id", "checked_in_at", "checked_out_at", "checked_in_by", "checked_out_by", "attendance_date", "checked_in_method", "checked_out_method", "checked_in_station", "checked_out_station", "special_instructions", "signature_data", "health_screening_fever", "health_screening_cough") VALUES
	('66fe05c0-9d0b-4e76-9cfa-89fb72839046', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', '72984069-6f33-4505-a672-287cfa967323', '2026-02-25 02:45:52.696673+00', '2026-02-25 02:48:46.841+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2026-02-25', NULL, NULL, NULL, NULL, NULL, NULL, false, false),
	('e42d5466-58b9-4651-850c-c69123619d2c', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', '72984069-6f33-4505-a672-287cfa967323', '2026-03-09 07:22:07.931323+00', '2026-03-09 08:20:15.99815+00', '8eb76649-9037-40b7-a305-69a3f0e185a4', '8eb76649-9037-40b7-a305-69a3f0e185a4', '2026-03-09', NULL, NULL, NULL, NULL, NULL, NULL, false, false),
	('0c354dde-f5b6-4b82-b623-670628c043ef', 'bb83d489-c141-4140-a18f-c9820564ebf1', '72984069-6f33-4505-a672-287cfa967323', '2026-03-09 07:22:54.647773+00', '2026-03-09 08:20:25.261012+00', '8eb76649-9037-40b7-a305-69a3f0e185a4', '8eb76649-9037-40b7-a305-69a3f0e185a4', '2026-03-09', NULL, NULL, NULL, NULL, NULL, NULL, false, false),
	('69aba65a-b5a6-4bee-8fe3-a36f55adf3ab', 'bb83d489-c141-4140-a18f-c9820564ebf1', '72984069-6f33-4505-a672-287cfa967323', '2026-03-09 08:23:39.721381+00', '2026-03-09 08:24:40.013702+00', '8eb76649-9037-40b7-a305-69a3f0e185a4', '8eb76649-9037-40b7-a305-69a3f0e185a4', '2026-03-09', NULL, NULL, NULL, NULL, NULL, NULL, false, false),
	('b03964e5-c380-4081-ad91-859c11634c7e', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', '72984069-6f33-4505-a672-287cfa967323', '2026-03-09 23:01:15.94532+00', '2026-03-19 22:06:15.949433+00', 'ce29ae44-edfe-481c-a5ee-a5fbc78dff84', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-09', NULL, 'emergency_admin_bulk', NULL, 'Staff Dashboard', NULL, NULL, false, false),
	('6532f809-0bf5-43eb-adf8-f16ce2ba65fb', '4c3e424e-3cf9-4c94-b7c7-33570de141d4', '1a033672-21e8-416a-a039-26bf26a8f08a', '2026-04-29 23:57:28.61558+00', '2026-04-30 11:02:06.355+00', '4f102c68-f2d1-4111-90cb-4e587ede99ee', NULL, '2026-04-29', 'kiosk', NULL, 'Main Kiosk', NULL, NULL, NULL, false, false),
	('b7c117b7-cd55-402c-8252-9066b12d6ada', 'bb83d489-c141-4140-a18f-c9820564ebf1', '72984069-6f33-4505-a672-287cfa967323', '2026-04-29 23:15:13.560147+00', '2026-04-30 11:02:08.348+00', 'b7d060ac-2044-4ffb-8ba3-de46d183c05a', NULL, '2026-04-29', 'kiosk', NULL, 'Main Kiosk', NULL, NULL, NULL, false, false),
	('e4cdd6b1-b36d-45fb-b1ac-4be8ee400590', 'bb83d489-c141-4140-a18f-c9820564ebf1', '1a033672-21e8-416a-a039-26bf26a8f08a', '2026-04-30 11:25:00.696791+00', '2026-04-30 11:36:20.386516+00', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', '2026-04-30', 'kiosk', 'kiosk', 'Main Kiosk', 'Main Kiosk', NULL, NULL, false, false);


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."calendar_events" ("id", "title", "description", "start_date", "end_date", "location", "created_by", "created_at", "updated_at") VALUES
	('ce9d0490-b279-415a-8569-3aa2960eacc9', 'Test Class', NULL, '2026-03-01 05:25:00+00', '2026-03-08 05:25:00+00', 'test 2', NULL, '2026-02-24 04:26:00.626902+00', '2026-02-24 04:26:00.626902+00');


--
-- Data for Name: centers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."centers" ("id", "name", "address", "city", "state_province", "postal_code", "country", "latitude", "longitude", "phone", "email", "is_active", "created_at", "updated_at") VALUES
	('1a3e2a38-ba5b-4d43-98a1-26cb6ca18bca', 'KiddoChecker North', '123 Northern Ave', 'Toronto', 'ON', 'M4B 1B4', 'Canada', 43.7000, -79.4000, NULL, NULL, true, '2026-03-11 13:14:17.137918+00', '2026-03-11 13:14:17.137918+00'),
	('b0737a20-2db6-4749-bb44-79fa2702d8b2', 'KiddoChecker West', '456 Western Rd', 'Mississauga', 'ON', 'L5B 2C4', 'Canada', 43.5890, -79.6441, NULL, NULL, true, '2026-03-11 13:14:17.137918+00', '2026-03-11 13:14:17.137918+00'),
	('0df322b6-b4e4-410d-af6a-3382a0e71fc4', 'KiddoChecker Downtown', '789 Central St', 'Toronto', 'ON', 'M5V 2H1', 'Canada', 43.6532, -79.3832, NULL, NULL, true, '2026-03-11 13:14:17.137918+00', '2026-03-11 13:14:17.137918+00');


--
-- Data for Name: child_medical_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."child_medical_profiles" ("id", "child_id", "blood_type", "allergies", "medications", "conditions", "dietary_restrictions", "emergency_notes", "doctor_name", "doctor_phone", "insurance_provider", "insurance_number", "last_physical_date", "created_at", "updated_at") VALUES
	('7c3bb310-b601-41f3-85e3-4dfaaacd10f1', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', '', '[]', '[]', '[]', '', '', '', '', '', '', NULL, '2026-03-07 16:30:51.663662+00', '2026-03-07 16:30:51.059+00'),
	('786ad6b9-b30b-4916-bfaa-89a4bd3db27d', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', NULL, '[{"type": "Peanut, eggs", "reaction": "Migrated from legacy", "severity": "moderate"}]', '[]', '[]', NULL, 'None', NULL, NULL, NULL, NULL, NULL, '2026-02-25 02:47:31.774819+00', '2026-03-10 03:52:33.366+00'),
	('c5f73938-ebf8-4dc3-b51e-83c84fccd460', '5912411d-56c1-40bc-8b15-4286409eb760', '', '[{"type": "Peanut", "severity": "moderate"}, {"type": "Water(cold)", "severity": "moderate"}, {"type": "Soda", "severity": "moderate"}]', '[]', '[]', '', 'In case of Emergency please call 911 and then me', '', '', '', '', NULL, '2026-03-07 13:25:34.902086+00', '2026-03-10 04:12:53.416+00'),
	('bb3c4fb1-b35a-42f5-9917-add30f1e97ed', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', '', '[]', '[]', '[]', '', '', '', '', '', '', NULL, '2026-03-15 19:55:24.589389+00', '2026-03-15 19:55:23.43+00'),
	('183c7519-489c-4c1c-abf9-3375d8525465', 'bb83d489-c141-4140-a18f-c9820564ebf1', 'B+', '[{"type": "Penut", "severity": "moderate"}, {"type": "Egg", "severity": "moderate"}, {"type": "Heart Palputation", "severity": "moderate"}]', '[{"name": "Tylano", "dosage": "1 tsp"}]', '[]', NULL, 'In case of an emergency reach out to me', 'Michael Adams', NULL, NULL, NULL, NULL, '2026-02-25 02:47:31.774819+00', '2026-03-22 22:58:10.086+00'),
	('bd079c3f-4461-45c1-ba8e-d032e52ce828', 'ca978de3-d492-4ec1-95d1-5c47f6b2d278', '', '[{"type": "Peanuts", "severity": "moderate"}]', '[]', '[]', '', '', '', '', '', '', NULL, '2026-03-25 23:55:02.743523+00', '2026-03-25 23:55:02.395+00'),
	('673db151-39e9-4e24-9141-685270313883', 'f84b51db-4468-4e33-8cb0-9921259def9f', '', '[{"type": "None", "severity": "moderate"}]', '[]', '[]', '', '', '', '', '', '', NULL, '2026-03-30 03:20:24.074905+00', '2026-03-30 03:20:23.763+00'),
	('9768354f-7459-40b8-a369-84be0d6f7aed', '4c3e424e-3cf9-4c94-b7c7-33570de141d4', '', '[]', '[]', '[]', '', '', '', '', '', '', NULL, '2026-04-29 23:51:50.05301+00', '2026-04-29 23:51:49.955+00');


--
-- Data for Name: child_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "first_name", "last_name", "phone", "created_at", "updated_at", "address", "qr_code_data", "security_question", "security_answer", "security_answer_hash", "security_pin", "staff_pin", "avatar_url", "photo_url", "has_active_background_check", "bio", "specialties", "preferred_class_id", "max_hours_per_week", "department", "gender", "date_of_birth", "marital_status", "secondary_phone", "city", "state", "zip_code", "country", "occupation", "emergency_contact_name", "emergency_contact_phone", "website", "social_links", "email", "supervisor_id") VALUES
	('b7d060ac-2044-4ffb-8ba3-de46d183c05a', 'GVA-TAB-1', '(Kiosk)', NULL, '2026-04-29 23:08:55.519333+00', '2026-04-29 23:08:55.631989+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('4f102c68-f2d1-4111-90cb-4e587ede99ee', 'Sheryl', 'Dubon', '4168307753', '2026-04-29 23:50:58.81943+00', '2026-04-29 23:55:26.283959+00', '', NULL, NULL, NULL, NULL, '999999', NULL, '', '', false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('0b90bed6-9260-4705-808f-ca61de570d90', 'Test', 'User', NULL, '2026-02-24 17:40:47.186278+00', '2026-02-24 17:40:47.186278+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'Daramola', 'Titilayo', '7782560796', '2025-08-02 18:59:15.958736+00', '2026-04-30 11:22:26.772329+00', 'ABC address', NULL, NULL, NULL, NULL, '123456', NULL, '', '', false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('9955bf52-fdb6-46f1-8fb8-56a97b2fad8a', 'Test', 'User', NULL, '2026-03-07 13:23:42.397054+00', '2026-03-07 13:23:42.397054+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('ae6f6dfc-fb82-499e-ae12-17da9ad6ef30', 'Test', 'User', NULL, '2026-03-07 13:24:08.474416+00', '2026-03-07 13:24:08.474416+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('ce29ae44-edfe-481c-a5ee-a5fbc78dff84', 'Test 2', '(Kiosk)', NULL, '2026-03-09 06:55:25.874619+00', '2026-03-09 06:55:25.99747+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('8eb76649-9037-40b7-a305-69a3f0e185a4', 'Main', '(Kiosk)', NULL, '2026-03-09 07:18:36.855898+00', '2026-03-09 07:18:36.931877+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'Jeremy', 'J', '', '2026-03-09 15:15:25.219019+00', '2026-03-10 00:30:22.685895+00', NULL, NULL, NULL, NULL, NULL, NULL, 'Q7DRAQ', NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('281e0f5b-2aa4-4ff6-b944-4370577c180d', 'IPAD 1', '(Kiosk)', NULL, '2026-03-10 16:39:23.254844+00', '2026-03-10 16:39:23.439462+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('6f35c5e6-e56b-4590-bd3c-f50d7d4dcea6', 'Ipad1', '(Kiosk)', NULL, '2026-03-10 17:44:47.873646+00', '2026-03-10 17:44:47.968458+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'Jon', 'Goss', '6472999725', '2026-03-15 14:17:44.418817+00', '2026-03-15 14:17:44.544708+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('beeb1e9b-0cc2-4570-8f4e-89b57f682d23', 'Shari', 'Goss', NULL, '2026-03-15 19:53:11.310351+00', '2026-03-15 19:53:11.310351+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Wisdom', 'Salami', '2263498291', '2025-08-02 18:52:14.032032+00', '2026-03-16 02:48:45.014498+00', NULL, NULL, NULL, NULL, NULL, NULL, 'V9ZZM7', NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('48394295-9c6a-4688-90f4-896593753730', 'Juan', 'Espino', NULL, '2026-03-16 23:43:40.34751+00', '2026-03-16 23:43:40.532313+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL),
	('8883cae6-aa26-4103-89a7-3d6bcef7cefc', 'Jeremy J', 'Ramirez', '4015638190', '2026-03-21 03:30:53.814114+00', '2026-03-21 03:30:53.95319+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '{}', NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', 'registration@ileoja.ca', NULL),
	('4201caa1-b9f3-4514-9647-031e9e929be6', 'wise', 'john', '1112224456', '2026-03-21 22:05:14.980435+00', '2026-03-21 22:05:15.163358+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '{}', NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', 'admin@ileoja.ca', NULL),
	('c552444f-f201-41f9-91c4-09daef2405f3', 'Jeremy J', 'Ramirez', '', '2026-03-21 22:01:10.78936+00', '2026-03-24 00:09:46.849365+00', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, '{}', NULL, 40, NULL, 'Male', NULL, NULL, NULL, '', '', '', 'USA', '', '', '', NULL, '{}', 'jeron.sena@farmoaks.come', NULL),
	('900c5e2a-5622-4a7f-be84-f1961c6a5fd6', 'QA', 'Parent', '5550199', '2026-03-25 23:54:09.277366+00', '2026-03-26 15:11:20.895362+00', '', NULL, NULL, NULL, NULL, '1234', NULL, '', '', false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', 'qa_parent_flow_2@example.com', NULL),
	('93dfa015-046c-4380-b2c4-f0b8d8844f2c', 'QA Test', 'Parent', NULL, '2026-03-30 03:18:45.834707+00', '2026-03-30 03:18:45.834707+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', 'qatestparent@example.com', NULL),
	('2cf038b9-160e-414e-b800-1353cd2a0370', 'test3', '(Kiosk)', NULL, '2026-04-29 19:52:04.857052+00', '2026-04-29 19:52:04.940455+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, 40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'USA', NULL, NULL, NULL, NULL, '{}', NULL, NULL);


--
-- Data for Name: church_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."church_memberships" ("id", "profile_id", "child_id", "membership_type", "status", "joined_at", "baptism_date", "confirmation_date", "wedding_date", "pastoral_notes", "spiritual_milestones", "created_at", "updated_at", "journey_stage") VALUES
	('80b19dec-4f61-4cf9-b2f5-df98b24e9436', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', NULL, 'visitor', 'active', '2026-03-20 07:51:36.154+00', NULL, NULL, NULL, NULL, '[]', '2026-03-20 07:51:36.222526+00', '2026-03-20 07:51:36.222526+00', 'initial_visit'),
	('cca70ce1-f775-4d62-b38b-c13f3ef76e0a', '0b90bed6-9260-4705-808f-ca61de570d90', NULL, 'visitor', 'active', '2026-03-20 07:52:16.732+00', NULL, NULL, NULL, NULL, '[]', '2026-03-20 07:52:16.886222+00', '2026-03-20 07:52:16.886222+00', 'initial_visit'),
	('1696adc9-1728-442f-9f97-712860578cf5', '4201caa1-b9f3-4514-9647-031e9e929be6', NULL, 'visitor', 'active', '2026-03-21 22:05:15.478+00', NULL, NULL, NULL, NULL, '[]', '2026-03-21 22:05:15.592929+00', '2026-03-21 22:05:15.592929+00', 'followed_up'),
	('f99bf532-359f-4068-914d-f3b0afcbda6f', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', NULL, 'registered', 'active', '2026-03-20 07:51:12.69+00', NULL, NULL, NULL, NULL, '[]', '2026-03-20 07:51:12.792469+00', '2026-03-20 07:51:12.792469+00', 'member'),
	('f288bf69-55c4-42e5-8045-49b5601649aa', 'c552444f-f201-41f9-91c4-09daef2405f3', NULL, 'visitor', 'active', '2026-03-21 22:01:11.006+00', NULL, NULL, NULL, NULL, '[]', '2026-03-21 22:01:11.114526+00', '2026-03-21 22:01:11.114526+00', 'connected');


--
-- Data for Name: communication_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."communication_settings" ("id", "twilio_account_sid", "twilio_auth_token", "twilio_phone_number", "enable_sms_pickups", "enable_email_pickups", "updated_at", "resend_api_key", "resend_domain") VALUES
	('46971e1a-c88d-40a3-b67c-e7165d6830c8', NULL, NULL, NULL, false, false, '2026-03-11 01:36:44.729896+00', NULL, NULL);


--
-- Data for Name: communications_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custom_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."custom_roles" ("id", "name", "description", "created_at", "is_system_role", "base_role") VALUES
	('f8d12405-0181-4c32-a2f9-ed813aeff68c', 'Kiosk', 'Dedicated role for check-in kiosk devices with limited access', '2026-03-08 02:21:53.983933+00', false, NULL),
	('76edddfe-0919-4758-9adc-e79e5f0c96d2', 'System: Administrator', 'Baseline permissions for organizational administrators.', '2026-05-01 12:11:43.97425+00', true, 'admin'),
	('a94722aa-daa4-4e82-8630-6f8c0e644744', 'System: Staff', 'Standard operational permissions for staff members.', '2026-05-01 12:11:43.97425+00', true, 'staff'),
	('53ce5f1c-f823-4680-8c1c-3e476ab58a6f', 'System: Teacher', 'Standard educational and classroom management permissions.', '2026-05-01 12:11:43.97425+00', true, 'teacher'),
	('73a7f5fd-a24e-46f8-9530-2a9e1e6fc283', 'System: Assistant Teacher', 'Restricted classroom support permissions.', '2026-05-01 12:11:43.97425+00', true, 'teacher_assistant'),
	('e622f376-8673-40c8-b502-e1c08f9ac5db', 'System: Volunteer', 'Minimum viable permissions for event-based volunteers.', '2026-05-01 12:11:43.97425+00', true, 'volunteer'),
	('c74dddfb-8d88-4ad8-9c99-75d32dedd59b', 'System: Kiosk', 'Fixed-terminal permissions for automated check-in hardware.', '2026-05-01 12:11:43.97425+00', true, 'kiosk'),
	('7fdc1e61-7877-460d-8196-a1d8c4d5d656', 'System: Parent', 'Personal data access and children management for families.', '2026-05-01 12:11:43.97425+00', true, 'parent');


--
-- Data for Name: data_access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."data_access_logs" ("id", "user_id", "resource_type", "resource_id", "accessed_at", "context") VALUES
	('5d6bfc5d-6b24-486a-a259-7de77dc26962', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'child_medical_notes', 'bb83d489-c141-4140-a18f-c9820564ebf1', '2026-05-01 00:34:27.565539+00', NULL),
	('5825af5b-8d00-4f58-9780-30d4feb2d5e3', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'child_medical_notes', 'bb83d489-c141-4140-a18f-c9820564ebf1', '2026-05-01 00:34:27.588387+00', NULL),
	('d94d5ee7-96b8-434a-8218-d1a24158db67', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'child_medical_notes', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', '2026-05-01 13:19:20.419762+00', NULL);


--
-- Data for Name: debug_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."debug_users" ("id", "email", "role", "is_super_admin", "created_at") VALUES
	('9955bf52-fdb6-46f1-8fb8-56a97b2fad8a', 'testparent@example.com', 'parent', false, '2026-03-09 03:42:14.765922+00'),
	('d37e8e9f-6d21-4a63-b285-3aa973dc7c6c', 'wisdom.salami@tdwas.com', 'super_admin', true, '2026-03-09 03:42:14.765922+00'),
	('64ec1fdb-5c64-44f3-a601-55c59b912ad8', 'wisejobsnaija@gmail.com', 'teacher', false, '2026-03-09 03:42:14.765922+00'),
	('e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'bunmite1212@yahoo.com', 'parent', false, '2026-03-09 03:42:14.765922+00'),
	('0b90bed6-9260-4705-808f-ca61de570d90', 'testuser@example.com', 'parent', false, '2026-03-09 03:42:14.765922+00'),
	('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'wisdom_borntobegreat@yahoo.com', 'super_admin', true, '2026-03-09 03:42:14.765922+00'),
	('ae6f6dfc-fb82-499e-ae12-17da9ad6ef30', 'testparent2@example.com', 'super_admin', true, '2026-03-09 03:42:14.765922+00');


--
-- Data for Name: enrolled_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."enrolled_devices" ("id", "name", "type", "enrollment_code", "status", "created_at", "location", "enrolled_by", "organization_id", "last_seen", "last_ip", "device_info", "enrolled_at", "revoked_at", "revoked_by", "notes", "updated_at", "hardware_id", "os_info", "browser_info", "device_fingerprint", "failure_count", "locked_until", "security_status", "serial_number") VALUES
	('867142cf-16ba-4f08-9eee-bf6b57eb8dd1', 'Ipad1', 'kiosk', '6Q4-452NA', 'active', '2026-03-10 17:43:25.774962+00', 'Home school', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2026-03-10 17:44:47.493+00', '76.69.106.72,76.69.106.72, 99.82.167.235', '{}', '2026-03-10 17:43:25.541+00', NULL, NULL, NULL, '2026-03-10 17:44:47.581868+00', 'TW96aWxsYS81LjAgKGlQYWQ7IENQVSBP', 'iPad', 'Mozilla/5.0 (iPad; CPU OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/143.0.7499.151 Mobile/15E148 Safari/604.1', '{"cores": 4, "memory": "unknown", "language": "en-CA", "timezone": "America/Toronto", "userAgent": "Mozilla/5.0 (iPad; CPU OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/143.0.7499.151 Mobile/15E148 Safari/604.1", "resolution": "810x1080"}', 0, NULL, 'secure', NULL),
	('2662acef-aacd-4dd6-af8a-073cbe240916', 'Test 2', 'phone', '6M5-CE82Z', 'active', '2026-03-09 06:15:09.856336+00', 'Test', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2026-03-22 04:38:47.259+00', '76.71.30.158,76.71.30.158, 99.82.167.209', '{}', '2026-03-09 06:15:09.477+00', NULL, NULL, NULL, '2026-03-22 04:38:47.284475+00', 'kc-id-4d35756f4b5733486b292f2e65', 'Linux armv81', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36', '{"cores": 8, "memory": 4, "language": "en-CA", "timezone": "America/Toronto", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36", "resolution": "412x922"}', 0, NULL, 'secure', NULL),
	('7b4d0bc3-718e-41d3-956d-af3cf14a5716', 'Main', 'kiosk', 'WWN-26Q6T', 'active', '2026-03-09 07:18:18.38573+00', 'MainPD', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2026-03-22 04:39:24.102+00', '76.71.30.158,76.71.30.158, 99.82.167.213', '{}', '2026-03-09 07:18:17.848+00', NULL, NULL, NULL, '2026-03-22 04:39:24.128136+00', 'kc-id-4d35756f4b5733486b292f2e65', 'Linux armv81', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '{"cores": 8, "memory": 4, "language": "en-CA", "timezone": "America/Toronto", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36", "resolution": "412x922"}', 0, NULL, 'secure', NULL),
	('3c0da40e-4827-49c2-951e-b2f01a03cce0', 'test3', 'kiosk', 'YY9-DZSMK', 'active', '2026-04-29 19:51:44.243983+00', NULL, '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, NULL, NULL, '{}', '2026-04-29 19:51:44.054+00', NULL, NULL, NULL, '2026-04-29 19:51:44.243983+00', NULL, NULL, NULL, '{}', 0, NULL, 'secure', NULL);


--
-- Data for Name: device_activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_activity_log" ("id", "device_id", "action", "performed_by", "ip_address", "metadata", "created_at") VALUES
	('afae28ee-d90e-4a00-89b6-47b9b02e9a59', '2662acef-aacd-4dd6-af8a-073cbe240916', 'enrolled', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '{"name": "Test 2", "type": "phone"}', '2026-03-09 06:15:09.928039+00'),
	('c30c4b99-ef15-4dd4-8147-00fbdc8b4cdb', '7b4d0bc3-718e-41d3-956d-af3cf14a5716', 'enrolled', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '{"name": "Main", "type": "kiosk"}', '2026-03-09 07:18:18.472057+00'),
	('c925a4da-fe2c-474e-bc52-fbf390c1e13b', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-09T08:19:58.431Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-03-09 08:19:58.530273+00'),
	('56ca92a8-26f2-4328-9cd0-0c9f8761229c', NULL, 'check_out', NULL, NULL, '{"ts": "2026-03-09T08:20:16.010Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "child_id": "ba14ff58-fd5a-4a95-b934-dc086f841d90", "child_name": "Kiosk Kid"}', '2026-03-09 08:20:16.06949+00'),
	('11e614bb-ed6e-4b20-bdd0-fc46d2a2e346', NULL, 'check_out', NULL, NULL, '{"ts": "2026-03-09T08:20:25.265Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "child_name": "Daramola Balogun"}', '2026-03-09 08:20:25.325423+00'),
	('339289d3-bb2b-4700-9fa7-12e628b4ad63', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-09T08:23:31.328Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-03-09 08:23:31.401842+00'),
	('e2abe963-25a3-4ed3-989a-3d58a0b1e1a8', NULL, 'check_in', NULL, NULL, '{"by": "parent:Daramola Titilayo", "ts": "2026-03-09T08:23:39.733Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "child_name": "Daramola Balogun", "class_name": "Dem 1"}', '2026-03-09 08:23:39.812802+00'),
	('f1f1adc7-3b33-4b49-ad5d-b211e0db24a6', NULL, 'check_out', NULL, NULL, '{"ts": "2026-03-09T08:24:40.025Z", "acc": 97, "lat": 44.10129043566443, "lon": -79.56815430174714, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "child_name": "Daramola Balogun"}', '2026-03-09 08:24:40.094251+00'),
	('2ec2cd89-9f06-4f69-9c05-1d90b0a54a6b', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-09T09:06:21.076Z", "acc": 11.5600004196167, "lat": 44.1017291, "lon": -79.567846, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-09 09:06:22.335528+00'),
	('e1774a86-e114-4916-8d8a-b76ba738c116', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-09T09:08:50.741Z", "acc": 100, "lat": 44.101330626470165, "lon": -79.56829055105509, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-09 09:08:50.809469+00'),
	('50dec2e3-a907-4a6f-a6ae-3c3d62682db3', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-09T14:55:28.506Z", "acc": 100, "lat": 44.1017312, "lon": -79.5678226, "actor": "system/anonymous", "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-03-09 14:55:29.707324+00'),
	('c45f8a5f-1b54-46f2-8985-8060ede5f498', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-09T22:17:38.666Z", "acc": 10.053999900817871, "lat": 44.1016054, "lon": -79.5676262, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-09 22:17:39.997095+00'),
	('1ae8e330-a0d2-46a5-9329-9faad7978279', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-09T22:58:41.750Z", "acc": 12.736000061035156, "lat": 44.1017083, "lon": -79.56781, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-09 22:58:43.216117+00'),
	('6e8f1414-a04e-45ed-ad87-db151cfaaafc', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-09T23:00:22.615Z", "acc": 14.565999984741211, "lat": 44.1017006, "lon": -79.567797, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-09 23:00:23.93168+00'),
	('1598bad8-fd9c-49f4-b79d-088f8a718e41', NULL, 'check_in', NULL, NULL, '{"by": "staff:Wisdom Salami", "ts": "2026-03-09T23:01:14.784Z", "acc": 14.565999984741211, "lat": 44.1017006, "lon": -79.567797, "actor": "staff:Wisdom Salami", "child_id": "a6e9ed82-dcfc-4de2-a486-fe5779f4f428", "child_name": "Joh Ade", "class_name": "Dem 1"}', '2026-03-09 23:01:16.04457+00'),
	('0b8d5752-581f-4d60-beae-b465b0ccc34c', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T03:51:56.599Z", "acc": 99, "lat": 44.10143937371663, "lon": -79.56826617819564, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 03:51:56.667475+00'),
	('703bec62-3427-4e64-81ff-5fda02345a10', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T03:53:32.546Z", "acc": 100, "lat": 44.1017038, "lon": -79.5678129, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 03:53:33.885139+00'),
	('d5db726c-9da0-4216-bbe0-52789f0ae2bb', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T04:06:09.349Z", "acc": 99, "lat": 44.10142136039331, "lon": -79.5682358765765, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 04:06:09.393401+00'),
	('4e5a66ff-9577-43e7-8b69-6fd9c7df77d7', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T04:31:39.604Z", "acc": 13.116999626159668, "lat": 44.1017072, "lon": -79.5678323, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 04:31:40.997432+00'),
	('6e1bdf11-3693-43ae-8528-13887f320600', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T13:05:28.781Z", "acc": 99, "lat": 44.101336795522506, "lon": -79.56820132778502, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 13:05:29.507177+00'),
	('559498eb-1294-4850-a27a-82e3f6cd2636', '867142cf-16ba-4f08-9eee-bf6b57eb8dd1', 'enrolled', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '{"name": "Ipad1", "type": "kiosk"}', '2026-03-10 17:43:25.86497+00'),
	('87b7caa4-3f13-430c-aa04-432cd32c8c6d', '867142cf-16ba-4f08-9eee-bf6b57eb8dd1', 'terminal_activated', NULL, NULL, '{"ip": "76.69.106.72,76.69.106.72, 99.82.167.234", "os": "iPad", "browser": "Mozilla/5.0 (iPad; CPU OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/143.0.7499.151 Mobile/15E148 Safari/604.1"}', '2026-03-10 17:44:42.014985+00'),
	('59410b53-1d35-44fc-b7ff-55d6c603de96', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T18:17:30.437Z", "acc": 100, "lat": 44.1017042, "lon": -79.5678242, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 18:17:31.899323+00'),
	('578910df-f55e-4f67-b0b7-56d7785f1349', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T18:20:40.587Z", "acc": 5.570895901228093, "lat": 44.1017592440825, "lon": -79.5678395789218, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 18:20:40.607904+00'),
	('81e399f3-8e72-4442-8468-ca0b2abf8fdd', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:23:00.239Z", "acc": 14.562999725341797, "lat": 44.1017413, "lon": -79.5678935, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:23:01.686448+00'),
	('15745038-c3d8-4da9-bcd3-d78a0beb7c69', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:39:55.083Z", "acc": 11.321999549865723, "lat": 44.1017462, "lon": -79.5678795, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:39:56.563722+00'),
	('bf4f1272-a213-4bdd-931d-d6470f996343', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:40:57.177Z", "acc": 100, "lat": 44.1017462, "lon": -79.5678795, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:40:58.544682+00'),
	('54229425-2285-45c8-9da3-2ebeabfd524b', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:42:16.996Z", "acc": 99, "lat": 44.101372770138816, "lon": -79.56818166971769, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:42:17.333973+00'),
	('699ccee9-fd50-4b1e-b656-d9d16276f048', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:43:25.236Z", "acc": 99, "lat": 44.101447789230434, "lon": -79.56820741789642, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:43:25.571924+00'),
	('2cb2f2a0-fa92-4f9a-be93-4f8311cf3743', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T20:43:57.069Z", "acc": 99, "lat": 44.10142022685152, "lon": -79.56818740481523, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 20:43:57.385351+00'),
	('406ecf89-71e6-40b1-9597-d246f1f6ab94', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T21:10:17.609Z", "acc": 15.682000160217285, "lat": 44.1016302, "lon": -79.567692, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 21:10:19.028928+00'),
	('e8418cb1-c171-47a7-bb73-a2e6e39654c4', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T21:12:29.407Z", "acc": 12.206999778747559, "lat": 44.1017095, "lon": -79.5678337, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 21:12:30.801079+00'),
	('ea6192d4-720d-4ff2-ab57-797bda11ef62', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-10T21:14:48.977Z", "acc": 5.570895901228093, "lat": 44.1017592440825, "lon": -79.5678395789218, "actor": "system/anonymous", "method": "staff_pin", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": "Wisdom Salami"}', '2026-03-10 21:14:48.840544+00'),
	('c5a3ce75-be62-4d79-b41b-67cdb81a0fd4', '2662acef-aacd-4dd6-af8a-073cbe240916', 'terminal_activated', NULL, NULL, '{"ip": "209.29.168.1,209.29.168.1, 99.82.167.233", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36"}', '2026-03-15 14:19:19.574305+00'),
	('9f8c9e8e-acff-4ff7-a1e5-1e6fe06e603c', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-20T21:25:36.105Z", "actor": "system/anonymous", "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": ""}', '2026-03-20 21:25:36.208428+00'),
	('7474f8c8-094d-4c86-b5c9-cee4bfd64511', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-20T21:26:35.177Z", "actor": "system/anonymous", "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": ""}', '2026-03-20 21:26:35.268464+00'),
	('3f150a9a-41f9-4c83-801d-97a81f751a2d', '7b4d0bc3-718e-41d3-956d-af3cf14a5716', 'terminal_activated', NULL, NULL, '{"ip": "76.71.30.158,76.71.30.158, 99.82.167.210", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36"}', '2026-03-21 01:33:18.544994+00'),
	('eed4f9e9-07da-4000-826c-4d210e80370f', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-03-22T02:54:59.951Z", "acc": 100, "lat": 44.1016912, "lon": -79.5678274, "actor": "system/anonymous", "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": ""}', '2026-03-22 02:54:59.12475+00'),
	('a5160866-67e6-4cdc-af1c-03bbc1490ba5', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-22T04:25:25.499Z", "acc": 13.031999588012695, "lat": 44.1017021, "lon": -79.5677975, "actor": "system/anonymous", "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": ""}', '2026-03-22 04:25:24.633033+00'),
	('f8f4e944-e11f-409b-9c8b-92b705e0d033', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-24T17:01:05.254Z", "acc": 5.365401956162982, "lat": 44.101757032379936, "lon": -79.56783619803483, "actor": "system/anonymous", "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-03-24 17:01:05.996107+00'),
	('e9325da5-53ff-4ae7-83e5-1756d433e013', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-26T15:01:49.697Z", "actor": "system/anonymous", "parent_id": "900c5e2a-5622-4a7f-be84-f1961c6a5fd6", "parent_name": "QA Parent"}', '2026-03-26 15:01:50.089815+00'),
	('08b613e9-713f-4ce3-83f1-606690fa3bfb', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-03-26T22:25:55.915Z", "actor": "system/anonymous", "parent_id": "900c5e2a-5622-4a7f-be84-f1961c6a5fd6", "parent_name": "QA Parent"}', '2026-03-26 22:25:56.791983+00'),
	('0fe4b039-58fb-407c-920f-e8fc4bf22ec2', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'enrolled', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '{"name": "test3", "type": "kiosk"}', '2026-04-29 19:51:44.343336+00'),
	('6fdc1cfd-b109-48e2-8606-b28e76ec401b', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.238", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:51:50.898209+00'),
	('98f40eb9-4200-4d62-9494-f38269e27785', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.210", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:51:55.501896+00'),
	('c3c297a7-af56-41f9-8264-93e25ce30fc0', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.235", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:52:04.577352+00'),
	('1e815cdd-8c91-4577-824b-187b71e807f8', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.232", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:54:32.5114+00'),
	('7bc3d1e4-b2e9-4f8a-b196-8c4cbd6bea28', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.237", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:54:44.705319+00'),
	('803a44f6-b84b-43f0-b4ad-0d735f73e1e4', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.237", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:55:18.84152+00'),
	('4c70b106-1ddd-4da0-8d04-24fd10be71d6', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.234", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-04-29 19:55:28.898941+00'),
	('d10760ff-ac4b-4f4e-89dc-8b3deee2298a', NULL, 'check_in', NULL, NULL, '{"ts": "2026-04-29T23:15:13.633Z", "acc": 12.807000160217285, "lat": 44.0901194, "lon": -79.5675425, "actor": "system/anonymous", "health": {"cough": false, "fever": false}, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "child_name": "Daramola Balogun"}', '2026-04-29 23:15:13.734177+00'),
	('56ce9df7-2bfe-4b81-90a3-669b2620a180', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-04-29T23:56:22.033Z", "acc": 12.807000160217285, "lat": 44.0901194, "lon": -79.5675425, "actor": "system/anonymous", "parent_id": "4f102c68-f2d1-4111-90cb-4e587ede99ee", "parent_name": "Sheryl Dubon"}', '2026-04-29 23:56:22.110523+00'),
	('d8e7561b-cff0-4bbb-8acb-1ba556de9c75', NULL, 'check_in', NULL, NULL, '{"ts": "2026-04-29T23:57:28.662Z", "acc": 12.807000160217285, "lat": 44.0901194, "lon": -79.5675425, "actor": "parent:", "health": {"cough": false, "fever": false}, "child_id": "4c3e424e-3cf9-4c94-b7c7-33570de141d4", "child_name": "Marianne Dubon"}', '2026-04-29 23:57:28.704066+00'),
	('0b764010-57b3-4368-a188-1f9cfd1fb617', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-04-30T11:05:17.511Z", "acc": 86, "lat": 44.10182776966463, "lon": -79.56866350751055, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-04-30 11:05:17.674039+00'),
	('8e636bd4-8721-4630-a370-5bc76d133e4e', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-04-30T11:24:42.873Z", "acc": 84, "lat": 44.10183660483032, "lon": -79.5686720548771, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-04-30 11:24:43.154549+00'),
	('34cfafa8-8ff4-44cd-9982-763134f8917f', NULL, 'check_in', NULL, NULL, '{"ts": "2026-04-30T11:25:00.674Z", "acc": 84, "lat": 44.10183660483032, "lon": -79.5686720548771, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "child_name": "Daramola Balogun"}', '2026-04-30 11:25:00.890888+00'),
	('cef3f291-8694-4afc-b48a-f8a29fba700e', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-04-30T11:35:57.038Z", "acc": 84, "lat": 44.10183660483032, "lon": -79.5686720548771, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-04-30 11:35:57.200038+00'),
	('a3f08ef3-8e2b-4adf-afdf-b42deb1743fd', NULL, 'check_out', NULL, NULL, '{"ts": "2026-04-30T11:36:20.426Z", "acc": 84, "lat": 44.10183660483032, "lon": -79.5686720548771, "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1"}', '2026-04-30 11:36:20.596846+00'),
	('6fc8f61f-3e96-40b7-8748-de97a1eb7095', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.233", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:43:55.468572+00'),
	('e4e099d9-3afd-4eb1-84a1-15272d8e4c88', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.208", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:44:00.536239+00'),
	('aee75d40-010f-45c0-9fe6-55d75b619a4f', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.232", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:44:28.90218+00'),
	('f2e3cc1a-fd77-4586-855c-7d8a3922531b', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.209", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:44:35.001293+00'),
	('54682f7e-2adc-46be-9233-4e958943883a', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.208", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:52:48.454452+00'),
	('cc0f5ea1-3811-4651-9d7c-1ad052de0f6c', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.212", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 12:52:58.102892+00'),
	('a5e54ab1-2e88-4c36-b1f4-a2f21bf71c47', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.208", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 13:13:56.957382+00'),
	('3a2c6834-0f23-4e57-831f-ebf48b0166ee', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.235", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 13:14:07.718728+00'),
	('6663b3e3-5a36-4fe7-86d0-0f6c3485a606', NULL, 'staff_login', NULL, NULL, '{"ts": "2026-05-01T13:16:34.347Z", "acc": 14.53499984741211, "lat": 44.1017305, "lon": -79.5678147, "staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa", "staff_name": ""}', '2026-05-01 13:16:34.449147+00'),
	('314cf6c4-f77c-4d25-a91e-93c71a3dccfd', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-05-01T13:51:05.116Z", "acc": 83, "lat": 44.10145804031731, "lon": -79.56837803005129, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-05-01 13:51:05.213765+00'),
	('669da4dd-796d-457b-8e78-9843e1527bfc', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-05-01T13:54:57.801Z", "acc": 14.53499984741211, "lat": 44.1017305, "lon": -79.5678147, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-05-01 13:54:57.931083+00'),
	('0455193b-754d-4778-8837-825b1f71a2b9', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-05-01T14:02:13.912Z", "acc": 22.631000518798828, "lat": 44.1017426, "lon": -79.5678298, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-05-01 14:02:14.019763+00'),
	('e9353091-62b1-4c4a-8c11-12a9f5c79d31', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.209", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 14:12:01.196418+00'),
	('9fd224f9-3ade-4f60-bd35-3fcf41807586', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.211", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 14:12:07.757943+00'),
	('f0ad6e79-38c0-4e80-9bbc-15383a140f38', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.232", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 14:13:41.227975+00'),
	('f1a31377-f873-47d6-ac98-61d776b9570f', '3c0da40e-4827-49c2-951e-b2f01a03cce0', 'terminal_activated', NULL, NULL, '{"ip": "142.126.111.5,142.126.111.5, 99.82.167.237", "os": "Linux armv81", "browser": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36"}', '2026-05-01 14:13:53.376794+00'),
	('ff8cada2-6950-40c4-b07c-9f637670f056', NULL, 'parent_login', NULL, NULL, '{"ts": "2026-05-01T14:14:36.746Z", "acc": 15.050999641418457, "lat": 44.1017161, "lon": -79.5678124, "parent_id": "e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9", "parent_name": "Daramola Titilayo"}', '2026-05-01 14:14:35.840766+00');


--
-- Data for Name: device_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."device_profiles" ("id", "device_id", "name", "type", "location", "created_at", "updated_at") VALUES
	('5bc53a8a-7bf4-4c24-84a2-df9a7f97fab6', '894233da-82b8-49fb-ab97-d70d44516cb9', 'Test6', 'check_in_kiosk', 'Lobby', '2026-03-11 00:58:23.179078+00', '2026-03-11 00:58:23.179078+00');


--
-- Data for Name: document_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."document_requirements" ("id", "document_type", "display_name", "description", "required_for_roles", "is_mandatory", "has_expiry", "expiry_months", "created_at") VALUES
	('d44040f5-d7eb-4581-b966-8309fb21c7ff', 'police_check', 'Police/Criminal Record Check', 'A valid police background check or criminal record clearance. Must be less than 6 months old.', '{staff,teacher,teacher_assistant}', true, true, 12, '2026-02-25 02:22:04.491613+00'),
	('9bd20ce0-3086-4f82-9895-33f731ae5af8', 'child_protection_cert', 'Child Protection Training', 'Certificate of completion for child protection/safeguarding training.', '{staff,teacher,teacher_assistant}', true, true, 24, '2026-02-25 02:22:04.491613+00'),
	('441e3b0f-5c73-42b0-a38f-efb3584a54de', 'reference_letter', 'Pastoral/Character Reference', 'A reference letter from a pastor, church leader, or community leader.', '{staff,teacher,teacher_assistant}', true, false, NULL, '2026-02-25 02:22:04.491613+00'),
	('afc8c699-a75c-4eca-981f-d606cf435f28', 'first_aid_cert', 'First Aid Certificate', 'Valid first aid or CPR training certificate.', '{staff,teacher,teacher_assistant}', false, true, 24, '2026-02-25 02:22:04.491613+00'),
	('bf31bbe5-4cbe-40b9-a95b-6d5c34783292', 'training_cert', 'Relevant Training Certificate', 'Any relevant early childhood education or ministry training certificates.', '{staff,teacher,teacher_assistant}', false, false, NULL, '2026-02-25 02:22:04.491613+00'),
	('42253444-025b-40bb-84c5-1d2ec8699b7b', 'medical_clearance', 'Medical Clearance', 'Medical clearance to work with children, if applicable.', '{staff,teacher,teacher_assistant}', false, true, 12, '2026-02-25 02:22:04.491613+00');


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."donations" ("id", "member_id", "amount", "currency", "donation_date", "payment_method", "category", "is_anonymous", "notes", "recorded_by", "created_at") VALUES
	('a5752df6-7fae-4d6b-a382-3759b383946b', '1696adc9-1728-442f-9f97-712860578cf5', 20.00, 'USD', '2026-03-22 03:43:43.429+00', 'card', 'tithe', false, '', NULL, '2026-03-22 03:43:43.520426+00');


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_templates" ("id", "name", "subject", "body_html", "description", "placeholders", "created_at", "updated_at") VALUES
	('78fc328d-838c-4e0a-8fa7-14227f3709d1', 'staff_onboarding', 'Welcome to KiddoChecker - Your Account is Ready!', '<h1>Hello {{firstName}}!</h1><p>Your staff account for KiddoChecker has been created successfully.</p><p><strong>Your Temporary Credentials:</strong></p><ul><li>Email: {{email}}</li><li>Temporary Password: {{tempPassword}}</li></ul><p>Please log in at {{loginUrl}} and complete your registration wizard. You will be required to change your password upon first login.</p><p>Best regards,<br/>The Children''s Ministry Team</p>', 'Sent to new staff members when their account is created by an admin.', '["firstName", "email", "tempPassword", "loginUrl"]', '2026-03-09 06:10:58.242879+00', '2026-03-09 06:10:58.242879+00'),
	('fc6515a5-cae5-47d3-a8a7-5922f673b707', 'check_in_notification', '{{childName}} Checked In Successfully', '<h1>Check-in Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked in to <strong>{{className}}</strong> at {{time}}.</p><p>We hope they have a wonderful time!</p><p>Best regards,<br/>Children''s Ministry</p>', 'Sent to parents when their child is checked in.', '["childName", "className", "time"]', '2026-03-09 06:10:58.242879+00', '2026-03-09 06:10:58.242879+00'),
	('8795306a-4ac6-4d8d-b603-c16384733833', 'check_out_notification', '{{childName}} Checked Out Successfully', '<h1>Check-out Notification</h1><p>Hi there,</p><p>Your child, <strong>{{childName}}</strong>, has been checked out from <strong>{{className}}</strong> at {{time}}.</p><p>Thank you for joining us today!</p><p>Best regards,<br/>Children''s Ministry</p>', 'Sent to parents when their child is checked out.', '["childName", "className", "time"]', '2026-03-09 06:10:58.242879+00', '2026-03-09 06:10:58.242879+00'),
	('7be8e545-422d-4591-899f-22af93f500f3', 'visitor_followup_missing', 'We Missed You! 🕊️', '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Hi {{visitorName}},</h1>
    <p>We missed seeing you this weekend! We were thinking about you and wanted to check in.</p>
    <p>If there is anything we can pray for or any way we can support you, please don''t hesitate to reach out.</p>
    <p>Hope to see you soon!</p>
    <p>In Christ,</p>
    <p>The Pastoral Team</p>
  </div>', 'Sent when a visitor hasn''t returned for a follow-up week.', '["visitorName"]', '2026-03-20 05:57:29.191377+00', '2026-03-20 05:57:29.191377+00'),
	('2c32d3b1-4bbb-438b-aec0-65aaad710bbb', 'visitor_membership_invite', 'Taking the Next Step at {{churchName}} 🚶‍♂️', '<div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
    <h1 style="color: #6366f1;">Next Steps...</h1>
    <p>Hi {{visitorName}}, you''ve been a part of our community for a while now, and we''d love to invite you to our <strong>New Members Breakfast</strong>.</p>
    <p>This is a great chance to hear the vision of {{churchName}}, meet the staff, and find out how you can get plugged in.</p>
    <a href="{{inviteLink}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">RSVP Today</a>
    <p>Blessings,</p>
    <p>Member Relations</p>
  </div>', 'Invite regular visitors to become official church members.', '["visitorName", "churchName", "inviteLink"]', '2026-03-20 05:57:29.191377+00', '2026-03-20 05:57:29.191377+00'),
	('2fee032e-7dea-4914-a672-598c9ce3963a', 'visitor_welcome', 'Welcome to our family, {{firstName}}!', '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #4f46e5; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">We''re Glad You''re Here!</h1>
        </div>
        
        <p style="font-size: 18px;">Hi <strong>{{firstName}}</strong>,</p>
        
        <p>It was such a joy having you visit us. At <strong>KiddoChecker Church</strong>, we believe every person who walks through our doors is a guest of honor.</p>
        
        <div style="background-color: #f8fafc; border-radius: 24px; padding: 32px; margin: 32px 0; border: 1px solid #e2e8f0;">
            <h2 style="font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">What''s Next?</h2>
            <p style="margin: 0;">We''d love to get to know you better. If you have any prayer points or questions about our ministry, just reply to this email!</p>
        </div>

        <p>We have a special "New Members" orientation next Sunday. We''d love to see you there!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #94a3b8; text-align: center;">
            <p>© 2026 KiddoChecker Church. All rights reserved.</p>
        </div>
    </div>', 'Sent to first-time visitors after their initial visit.', '["visitorName", "churchName"]', '2026-03-20 05:57:29.191377+00', '2026-03-20 05:57:29.191377+00');


--
-- Data for Name: engagement_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."engagement_tasks" ("id", "title", "description", "status", "priority", "category", "due_date", "assigned_to", "member_id", "created_by", "created_at", "updated_at") VALUES
	('610467e2-db34-4a66-8467-35db5dc2b998', 'Test 1', 'Task created from CRM for wise', 'done', 'low', 'follow_up', NULL, '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '1696adc9-1728-442f-9f97-712860578cf5', NULL, '2026-03-24 00:20:37.450199+00', '2026-03-24 00:20:37.450199+00'),
	('b6a72059-7495-4254-9e17-5aad17389ef3', 'Prayer for Titi', 'Task created from CRM for Daramola', 'done', 'high', 'follow_up', NULL, '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', '80b19dec-4f61-4cf9-b2f5-df98b24e9436', NULL, '2026-03-24 01:04:48.888525+00', '2026-03-24 01:04:48.888525+00');


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."events" ("id", "title", "description", "start_date", "end_date", "location", "organizer", "is_public", "created_at", "updated_at", "created_by") VALUES
	('dc2ba595-deec-4c29-9546-62e2ceaf0236', 'Test', NULL, '2026-04-30 10:00:00+00', NULL, NULL, NULL, true, '2026-04-30 11:01:38.561722+00', '2026-04-30 11:01:38.561722+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa');


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."permissions" ("id", "name", "description", "resource", "action", "created_at", "category") VALUES
	('47f46292-9827-4eae-85db-68fb69f5f6b7', 'view_all_children', 'View all children records in the system', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'children'),
	('68eedca9-8a0c-41bd-952d-378cdd781749', 'manage_all_children', 'Create, edit, and delete any child record', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'children'),
	('bb973bc7-dfdd-4a1e-bb38-1c6e5b042d52', 'view_assigned_children', 'View children only in assigned classes', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'children'),
	('2b5d90e9-909d-4230-a851-bc99ba4d5938', 'manage_classes', 'Create, edit, and delete classrooms', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'management'),
	('625a72c8-928c-4cf4-a210-6905b1f30179', 'assign_staff_to_classes', 'Assign teachers and assistants to classes', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'management'),
	('e1e6b0aa-be88-43a3-86b6-6f42dafc2d9d', 'view_all_attendance', 'View attendance for all kids', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'attendance'),
	('17fa2ab8-4a8d-4938-b85d-bdc48dc60b6b', 'view_assigned_attendance', 'View attendance for assigned classes', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'attendance'),
	('d2f10bde-0384-4c79-a523-c242ac264bab', 'manage_qr_codes', 'Generate and print QR labels', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'kiosk'),
	('d4619178-0196-4240-aa58-824823bff0e7', 'manage_kiosk_settings', 'Configure kiosk behavior and timeouts', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'kiosk'),
	('a525e820-4234-455c-b7f7-ca8655e6aaba', 'manage_users', 'Create and manage user accounts and roles', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'management'),
	('2029d17f-f90e-433c-b393-094415da8392', 'view_audit_logs', 'Access system audit trails', NULL, NULL, '2026-03-10 02:07:54.40551+00', 'security'),
	('d70d979e-3d0a-4dea-ad86-1d2d97867371', 'church_view', 'Access the Church Management Dashboard', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'church'),
	('ce7deeac-6617-4dfe-8e17-1b69b6e512af', 'church_manage_members', 'Add, Edit, and Manage church members and profiles', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'church'),
	('5f8d13fe-2038-48a4-ac8f-02ee26738113', 'church_manage_ministries', 'Create and modify ministries and small groups', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'church'),
	('7db30572-5136-4a3a-b110-2c8028d9cea9', 'church_manage_volunteers', 'Manage volunteer roles and coverage details', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'church'),
	('1e751c7b-57c7-4dba-838b-2e94545dcfa7', 'church_crm_view', 'View visitor interactions and CRM timeline', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'crm'),
	('1279daf1-90df-4e56-8531-6bff0d1d30ea', 'church_crm_edit', 'Log interactions, take notes, and send automated follow-up emails', NULL, NULL, '2026-03-20 06:04:25.895161+00', 'crm'),
	('dba9ee01-4d0b-4d6b-9de4-44a9cda0fae6', 'checkin.manual_dashboard', 'Perform check-ins without a physical kiosk device', NULL, NULL, '2026-04-30 18:02:15.464087+00', 'attendance'),
	('64d4af41-e785-4767-90f4-61155fde3bb3', 'congregation.view_all', 'View the entire church/center roster', NULL, NULL, '2026-04-30 18:02:15.464087+00', 'profiles'),
	('a801a4e9-fbf6-4fb3-8462-741d95dd9489', 'staff.public_manager', 'Visible to all parents for escalation/support', NULL, NULL, '2026-04-30 18:02:15.464087+00', 'profiles'),
	('d0140bcd-3f83-4a42-a742-59912a1bf320', 'audit.view_forensics', 'Access security logs and forensic logs', NULL, NULL, '2026-04-30 18:02:15.464087+00', 'security'),
	('ca1cbbfe-ad1d-4faa-b484-45ceb37fcb8d', 'staff.manage_schedules', 'Create and edit roster templates', NULL, NULL, '2026-04-30 18:02:15.464087+00', 'management'),
	('9304f5a3-1a60-451c-b392-9986aeb451a8', 'access_kiosk', 'Ability to access and operate the check-in kiosk', 'kiosk', 'access', '2026-03-08 02:21:53.983933+00', 'General');


--
-- Data for Name: security_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."security_groups" ("id", "name", "description", "created_at") VALUES
	('6ae095db-a03c-4a1b-a34e-b32a4715bccd', 'Congregation Viewers', 'Users in this group can see the full church roster.', '2026-04-30 18:02:15.464087+00'),
	('511ec49d-951e-4394-a2c9-a2807ee43296', 'Forensic Auditors', 'Users in this group can access forensic security logs.', '2026-04-30 18:02:15.464087+00'),
	('a647c4be-d312-4176-98f5-21bea860031e', 'Shift Managers', 'Users in this group can manage staff schedules and rosters.', '2026-04-30 18:02:15.464087+00');


--
-- Data for Name: group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: journey_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."journey_progress" ("id", "membership_id", "journey_type", "current_step", "status", "next_run_at", "created_at", "updated_at") VALUES
	('c6bbd318-e68d-4ec7-9f8e-6613926b9291', 'cca70ce1-f775-4d62-b38b-c13f3ef76e0a', 'visitor_welcome', 0, 'active', '2026-03-20 07:52:16.886222+00', '2026-03-20 07:52:16.886222+00', '2026-03-20 07:52:16.886222+00'),
	('3437502d-92d3-4390-8526-caf2950c8fa1', 'f288bf69-55c4-42e5-8045-49b5601649aa', 'visitor_welcome', 0, 'active', '2026-03-21 22:01:11.114526+00', '2026-03-21 22:01:11.114526+00', '2026-03-21 22:01:11.114526+00'),
	('efd411f7-2a9d-4f44-b00b-c5779e229113', '1696adc9-1728-442f-9f97-712860578cf5', 'visitor_welcome', 0, 'active', '2026-03-21 22:05:15.592929+00', '2026-03-21 22:05:15.592929+00', '2026-03-21 22:05:15.592929+00');


--
-- Data for Name: kiosk_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kiosk_settings" ("id", "setting_key", "setting_value", "updated_at", "updated_by", "description") VALUES
	('456dae43-6039-47c1-ab5f-8c215bc98f98', 'auto_print_nametag', 'true', '2026-02-25 02:22:04.491613+00', NULL, NULL),
	('db6201f6-de3a-40b0-82c2-8c0f8b9765c9', 'allow_self_checkout', 'false', '2026-02-25 02:22:04.491613+00', NULL, NULL),
	('556a1c57-8e56-4bad-ab73-e5affaf5abcc', 'session_timeout_minutes', '30', '2026-02-25 02:22:04.491613+00', NULL, NULL),
	('eee634df-089a-4e71-b119-aa8cfa694b94', 'require_pin', 'true', '2026-03-09 06:19:31.091463+00', NULL, 'Whether to require the Master PIN for new terminal activations'),
	('788be515-f1c2-4177-a39a-0195e59d93cd', 'kiosk_pin', '198702', '2026-03-09 06:19:31.091463+00', NULL, 'Master PIN for activating terminals');


--
-- Data for Name: medical_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."medical_audit_logs" ("id", "child_id", "actor_id", "action", "old_data", "new_data", "created_at") VALUES
	('27e2f8c2-d2bc-4d44-ae5b-7bb522475b10', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', 'beeb1e9b-0cc2-4570-8f4e-89b57f682d23', 'INSERT', NULL, '{"id": "bb3c4fb1-b35a-42f5-9917-add30f1e97ed", "child_id": "9b0c41e3-c31b-4432-a8ef-21f47daf9e13", "allergies": [], "blood_type": "", "conditions": [], "created_at": "2026-03-15T19:55:24.589389+00:00", "updated_at": "2026-03-15T19:55:23.43+00:00", "doctor_name": "", "medications": [], "doctor_phone": "", "emergency_notes": "", "insurance_number": "", "insurance_provider": "", "last_physical_date": null, "dietary_restrictions": ""}', '2026-03-15 19:55:24.589389+00'),
	('3f772535-b3bc-4cb0-9d11-a5c28535fcdd', 'bb83d489-c141-4140-a18f-c9820564ebf1', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'UPDATE', '{"id": "183c7519-489c-4c1c-abf9-3375d8525465", "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "allergies": [{"type": "Penut", "severity": "moderate"}, {"type": "Egg", "severity": "moderate"}, {"type": "Heart Palputation", "severity": "moderate"}], "blood_type": "B+", "conditions": [], "created_at": "2026-02-25T02:47:31.774819+00:00", "updated_at": "2026-03-11T01:24:39.203+00:00", "doctor_name": "Michael Adams", "medications": [{"name": "Tylano", "dosage": "1 tsp"}], "doctor_phone": null, "emergency_notes": "In case of an emergency reach out to me", "insurance_number": null, "insurance_provider": null, "last_physical_date": null, "dietary_restrictions": null}', '{"id": "183c7519-489c-4c1c-abf9-3375d8525465", "child_id": "bb83d489-c141-4140-a18f-c9820564ebf1", "allergies": [{"type": "Penut", "severity": "moderate"}, {"type": "Egg", "severity": "moderate"}, {"type": "Heart Palputation", "severity": "moderate"}], "blood_type": "B+", "conditions": [], "created_at": "2026-02-25T02:47:31.774819+00:00", "updated_at": "2026-03-22T22:58:10.086+00:00", "doctor_name": "Michael Adams", "medications": [{"name": "Tylano", "dosage": "1 tsp"}], "doctor_phone": null, "emergency_notes": "In case of an emergency reach out to me", "insurance_number": null, "insurance_provider": null, "last_physical_date": null, "dietary_restrictions": null}', '2026-03-22 22:58:10.45478+00'),
	('dd08eb25-5895-45d7-b89f-bfd981975c58', 'ca978de3-d492-4ec1-95d1-5c47f6b2d278', '900c5e2a-5622-4a7f-be84-f1961c6a5fd6', 'INSERT', NULL, '{"id": "bd079c3f-4461-45c1-ba8e-d032e52ce828", "child_id": "ca978de3-d492-4ec1-95d1-5c47f6b2d278", "allergies": [{"type": "Peanuts", "severity": "moderate"}], "blood_type": "", "conditions": [], "created_at": "2026-03-25T23:55:02.743523+00:00", "updated_at": "2026-03-25T23:55:02.395+00:00", "doctor_name": "", "medications": [], "doctor_phone": "", "emergency_notes": "", "insurance_number": "", "insurance_provider": "", "last_physical_date": null, "dietary_restrictions": ""}', '2026-03-25 23:55:02.743523+00'),
	('abd6c7ad-4540-46e5-8a3d-60989477ce42', 'f84b51db-4468-4e33-8cb0-9921259def9f', '93dfa015-046c-4380-b2c4-f0b8d8844f2c', 'INSERT', NULL, '{"id": "673db151-39e9-4e24-9141-685270313883", "child_id": "f84b51db-4468-4e33-8cb0-9921259def9f", "allergies": [{"type": "None", "severity": "moderate"}], "blood_type": "", "conditions": [], "created_at": "2026-03-30T03:20:24.074905+00:00", "updated_at": "2026-03-30T03:20:23.763+00:00", "doctor_name": "", "medications": [], "doctor_phone": "", "emergency_notes": "", "insurance_number": "", "insurance_provider": "", "last_physical_date": null, "dietary_restrictions": ""}', '2026-03-30 03:20:24.074905+00'),
	('ccc090f1-0b60-476e-ace3-d327077f0f70', '4c3e424e-3cf9-4c94-b7c7-33570de141d4', '4f102c68-f2d1-4111-90cb-4e587ede99ee', 'INSERT', NULL, '{"id": "9768354f-7459-40b8-a369-84be0d6f7aed", "child_id": "4c3e424e-3cf9-4c94-b7c7-33570de141d4", "allergies": [], "blood_type": "", "conditions": [], "created_at": "2026-04-29T23:51:50.05301+00:00", "updated_at": "2026-04-29T23:51:49.955+00:00", "doctor_name": "", "medications": [], "doctor_phone": "", "emergency_notes": "", "insurance_number": "", "insurance_provider": "", "last_physical_date": null, "dietary_restrictions": ""}', '2026-04-29 23:51:50.05301+00');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."messages" ("id", "sender_id", "recipient_id", "subject", "content", "is_read", "created_at", "updated_at", "recipient_role", "is_broadcast", "sent_via_sms", "sent_via_email") VALUES
	('ba1507e4-fb6f-4d85-b66d-17ab32d2b6ec', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, NULL, '', false, '2025-11-01 13:48:44.882178+00', '2025-11-01 13:48:44.882178+00', NULL, false, false, false),
	('19f61376-cbb1-481d-84f2-719796508346', '0b90bed6-9260-4705-808f-ca61de570d90', NULL, NULL, 'hello', false, '2026-02-25 13:24:16.124367+00', '2026-02-25 13:24:16.124367+00', NULL, false, false, false),
	('dbbfa2dc-eebe-4bf7-bce9-3969ec928ce7', 'ae6f6dfc-fb82-499e-ae12-17da9ad6ef30', NULL, NULL, 'Hello from Test Parent!', false, '2026-03-07 13:27:21.517952+00', '2026-03-07 13:27:21.517952+00', NULL, false, false, false),
	('67606b5d-7e94-438c-8a5e-5250e631f5a4', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'Hi', 'Test Message', true, '2026-03-12 22:16:53.117309+00', '2026-03-12 22:16:53.117309+00', NULL, false, false, false),
	('e5531fe5-17d4-478f-bea8-022e92693e52', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'About Ade', 'How is he doing today', false, '2026-03-12 23:06:22.615495+00', '2026-03-12 23:06:22.615495+00', NULL, false, false, false),
	('cb26704d-6b78-48f4-b8ac-caf2416f1056', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Re: Hi', 'Hello Sir', true, '2026-03-12 23:05:32.711998+00', '2026-03-12 23:05:32.711998+00', NULL, false, false, false),
	('ad195b59-c5ed-42e8-aa59-47e03f510f1c', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'Test-First Message', 'Hi Joss,
Welcome to Kiddo App,
this is a Test Message from Wisdom', true, '2026-03-16 02:41:43.64328+00', '2026-03-16 02:41:43.64328+00', NULL, false, false, false),
	('8cda20a9-8d03-408f-9b17-3f354d623693', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Re: Test-First Message', 'Hi Wisdom,

Thanks, I haven''t had time to play with it too much yet, but I did create a second account under Shari as a parent and added a child.  One thing I have noticed that changing account password  doesn''t seem to be possible yet.

Jon.

--- Original Message ---
Hi Joss,
Welcome to Kiddo App,
this is a Test Message from Wisdom', true, '2026-03-16 13:12:21.510601+00', '2026-03-16 13:12:21.510601+00', NULL, false, false, false),
	('88370db4-ef77-4052-99d5-7020f36f60b8', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'Re: Test-First Message', 'Yes you right, in the current state, only Administrator can change password, I will add the password management by end users to my backlog and get that done before we deploy

--- Original Message ---
Hi Wisdom,

Thanks, I haven''t had time to play with it too much yet, but I did create a second account under Shari as a parent and added a child.  One thing I have noticed that changing account password  doesn''t seem to be possible yet.

Jon.

--- Original Message ---
Hi Joss,
Welcome to Kiddo App,
this is a Test Message from Wisdom', true, '2026-03-16 23:45:58.344256+00', '2026-03-16 23:45:58.344256+00', NULL, false, false, false),
	('66aaf978-71a1-4599-a9c6-bc18bd155eb6', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'Re: Hi', '

--- Original Message ---
Hello Sir
hi', true, '2026-03-12 23:08:40.307184+00', '2026-03-12 23:08:40.307184+00', NULL, false, false, false),
	('9d9af44c-1a18-4449-ba62-4127ee90d063', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'Re: Hi', '

--- Original Message ---
Hello Sir', true, '2026-03-12 23:09:51.827702+00', '2026-03-12 23:09:51.827702+00', NULL, false, false, false),
	('9b27f16c-1a98-4a2c-9daf-f63e8c2a8c53', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Re: Hi', 'whats up', true, '2026-03-20 15:44:59.807578+00', '2026-03-20 15:44:59.807578+00', NULL, false, false, false),
	('e2e6e29f-cbe6-47a7-9756-c2bcb79a6793', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'Re: Test-First Message', 'Hi Jon, Guess what ? i implemented the NFC scan to the app, i went back and did some research and found it was easy. it was as simple as implementing NFC module to the app that google chrome already support with the need to make the app a Native app', false, '2026-04-30 12:23:50.383948+00', '2026-04-30 12:23:50.383948+00', NULL, false, false, false);


--
-- Data for Name: message_read_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ministries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ministries" ("id", "name", "description", "head_staff_id", "created_at", "updated_at") VALUES
	('cbd2571a-2e89-4c6c-b497-4d269f13bf5e', 'Youth', NULL, NULL, '2026-03-20 05:30:04.416241+00', '2026-03-20 05:30:04.416241+00'),
	('0b5cbf07-6efc-450e-bc3b-b2accbc7770c', 'Outreach', NULL, NULL, '2026-03-20 05:30:33.444463+00', '2026-03-20 05:30:33.444463+00'),
	('b96a3b20-a756-4468-a874-45927193f614', 'Men', NULL, '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-20 07:15:11.054128+00', '2026-03-20 07:15:11.054128+00');


--
-- Data for Name: ministry_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ministry_groups" ("id", "ministry_id", "name", "meeting_day", "meeting_time", "location", "leader_profile_id", "created_at", "updated_at") VALUES
	('f248ed7f-bd4a-49bc-b9cf-352c53dba30a', 'cbd2571a-2e89-4c6c-b497-4d269f13bf5e', 'Bradford Missions', NULL, NULL, NULL, NULL, '2026-03-20 05:30:53.458982+00', '2026-03-20 05:30:53.458982+00'),
	('25d93761-27bb-41cf-a254-a81dbe5cecb3', 'cbd2571a-2e89-4c6c-b497-4d269f13bf5e', 'Fellowship', 'Monday', '10:00:00', NULL, NULL, '2026-03-20 23:56:55.026857+00', '2026-03-20 23:56:55.026857+00'),
	('7eb9a372-d8fd-451f-8db3-3877fcbfd008', 'b96a3b20-a756-4468-a874-45927193f614', 'Mid Week', 'Sunday', '10:00:00', NULL, NULL, '2026-03-21 00:55:15.724182+00', '2026-03-21 00:55:15.724182+00');


--
-- Data for Name: ministry_member_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ministry_member_assignments" ("id", "membership_id", "group_id", "role", "assigned_at") VALUES
	('97c5f1f8-dcbe-4796-881b-24f47a587560', 'cca70ce1-f775-4d62-b38b-c13f3ef76e0a', 'f248ed7f-bd4a-49bc-b9cf-352c53dba30a', 'member', '2026-03-21 00:54:48.745647+00'),
	('74e86e57-673c-4bfc-9692-a331845a5ebb', 'f99bf532-359f-4068-914d-f3b0afcbda6f', '7eb9a372-d8fd-451f-8db3-3877fcbfd008', 'member', '2026-03-21 00:55:22.457934+00'),
	('c8b8192a-9711-4417-9440-f9a682383c41', 'cca70ce1-f775-4d62-b38b-c13f3ef76e0a', '7eb9a372-d8fd-451f-8db3-3877fcbfd008', 'member', '2026-03-21 00:55:29.357584+00'),
	('5893806d-3448-4df6-a59a-ca96b225c297', 'f99bf532-359f-4068-914d-f3b0afcbda6f', '25d93761-27bb-41cf-a254-a81dbe5cecb3', 'member', '2026-03-21 00:55:38.635348+00'),
	('98fcfe18-a763-4708-b026-ca3dfbc71718', '80b19dec-4f61-4cf9-b2f5-df98b24e9436', 'f248ed7f-bd4a-49bc-b9cf-352c53dba30a', 'member', '2026-03-23 23:24:31.792761+00');


--
-- Data for Name: organization_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organization_settings" ("id", "name", "logo_url", "primary_color", "font_family", "created_by", "created_at", "updated_at", "require_checkout_signature", "google_maps_api_key", "show_center_finder", "max_upload_size_kb", "upload_limit_type", "blocked_extensions", "show_wellness_check", "timezone") VALUES
	('fe805307-d4ad-46d6-b063-c8de9eee6e90', 'Green Valley Alliance', 'https://pxqztqcukuilqdermblq.supabase.co/storage/v1/object/public/avatars/p11208dcmtc_1773594733887.png', '#660000', 'Lato', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2025-08-02 18:52:14.162176+00', '2026-05-01 12:45:59.758008+00', false, NULL, false, 200, 'hard', '{exe,bat,sh,php,js,py}', true, 'America/New_York');


--
-- Data for Name: parent_children; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pending_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: qr_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."qr_codes" ("id", "child_id", "qr_data", "created_at", "expires_at", "is_active") VALUES
	('8bf9d712-31ce-4af0-a51a-8b38b99346ea', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', 'child:a6e9ed82-dcfc-4de2-a486-fe5779f4f428:1771987552545', '2026-02-25 02:45:52.813101+00', NULL, false),
	('f6f81dce-dc5d-4399-85a0-1316e24728d2', 'bb83d489-c141-4140-a18f-c9820564ebf1', '16e92734-f6e7-4ebc-a070-91a012b588c8', '2026-03-10 21:13:07.250472+00', NULL, false),
	('d8c03eef-ab7f-4865-b528-0fb9083ca985', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', 'c5923f0c-54b1-4cc3-a821-1f6661315464', '2026-03-10 21:15:12.383621+00', NULL, false),
	('c2af48a8-4296-403a-8d09-f4b85c1e8ad0', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', 'c6178f77-567f-47d2-9766-ed5381f97987', '2026-03-10 21:15:44.857217+00', NULL, false),
	('7bc43e8a-7fb3-4884-8189-1198f2ff331a', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', 'c3dc4ba9-8aa0-4353-92a4-4f759420b6dd', '2026-03-16 02:40:33.150931+00', NULL, false),
	('163494cc-b1e1-4c8b-ad2a-986736d94d5b', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', '9dd09fc0-d02c-43e6-bbd8-45a19fab49e1', '2026-03-22 00:30:33.940917+00', NULL, false),
	('1f41c4b0-33d8-496f-9602-39fa795d1e79', '5912411d-56c1-40bc-8b15-4286409eb760', '17e9a5c8-79fa-410e-9941-ef163b9398a0', '2026-03-22 03:34:57.743179+00', NULL, false),
	('a4a33bdd-ed61-46d9-a804-8aeec1f07937', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', 'aee3cfc8-d27c-4e43-819a-8b51849f0ff3', '2026-03-22 03:36:57.024245+00', NULL, false),
	('d15032a8-12f3-4975-b8d4-2769841f3e3a', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', 'b1180635-6512-483b-bcd2-02d0a541328a', '2026-03-22 03:36:57.024245+00', NULL, false),
	('c64dba0a-e1cc-43ad-8222-78ca043b847d', '5912411d-56c1-40bc-8b15-4286409eb760', 'cea67896-c9aa-4311-8494-b18183d2b959', '2026-03-22 03:36:57.024245+00', NULL, false),
	('149da3fb-f5a0-4e3a-841b-26389bb45086', 'bb83d489-c141-4140-a18f-c9820564ebf1', '2b65b526-b31c-408f-b7b2-aa2c26d54b99', '2026-03-22 03:36:57.024245+00', NULL, false),
	('a5d94e3e-19a4-480e-a318-5c0ae89b4667', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', '0588ebac-a049-4ed2-8b9e-658b4b7a03b0', '2026-03-22 03:36:57.024245+00', NULL, false),
	('ef58fcab-09d0-4d7a-8195-a8131d05514f', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', 'e335d8b9-e3fa-4484-a6a5-5d28770f3915', '2026-03-22 03:37:43.211574+00', NULL, false),
	('4bc5978f-0082-4f84-ae96-b1390a87a9b0', 'ba14ff58-fd5a-4a95-b934-dc086f841d90', '76928566-533c-44b8-a59a-58bd770b3907', '2026-03-22 04:15:23.071662+00', NULL, true),
	('7030c197-cea7-4753-8d32-f942f526351e', 'a6e9ed82-dcfc-4de2-a486-fe5779f4f428', '90b541f6-4dfc-4421-b862-2d41090ffcc7', '2026-03-22 04:15:23.071662+00', NULL, true),
	('859c4bbc-25bc-4066-81ec-1bd10acdf926', '5912411d-56c1-40bc-8b15-4286409eb760', '95026903-62a8-4796-ad59-fb72b34611b8', '2026-03-22 04:15:23.071662+00', NULL, true),
	('4724df43-c995-4848-8e06-2e664169a257', 'bb83d489-c141-4140-a18f-c9820564ebf1', 'a3821614-98b1-44d9-888f-19ff28b65716', '2026-03-22 04:15:23.071662+00', NULL, true),
	('91be6ee6-88e4-4cfc-acf0-535b9fecc25f', '9b0c41e3-c31b-4432-a8ef-21f47daf9e13', 'b0ee4ab2-a338-4864-9f4c-7023f93dab2f', '2026-03-22 04:15:23.071662+00', NULL, true);


--
-- Data for Name: report_seals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rewards" ("id", "name", "description", "points", "image_url", "created_at", "updated_at") VALUES
	('6ff23ca8-745d-4f46-a580-a0592954cc68', '3 Days in a RoW', '', 10, NULL, '2026-03-11 00:27:11.556399+00', '2026-03-11 00:27:11.556399+00');


--
-- Data for Name: reward_redemptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role_permissions" ("id", "role_id", "permission_id", "created_at") VALUES
	('d7ec980c-bad2-45b6-b2e6-43ebdc7c0002', 'f8d12405-0181-4c32-a2f9-ed813aeff68c', '9304f5a3-1a60-451c-b392-9986aeb451a8', '2026-03-08 02:21:53.983933+00'),
	('79326bd1-45a6-4f73-bf2a-25fcca4bec8d', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '47f46292-9827-4eae-85db-68fb69f5f6b7', '2026-05-01 12:11:43.97425+00'),
	('3e1ea5c1-6492-41a4-be0b-2d906b634c5d', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '68eedca9-8a0c-41bd-952d-378cdd781749', '2026-05-01 12:11:43.97425+00'),
	('65daa8d3-c8b6-4031-b96e-e3f792dd6974', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'bb973bc7-dfdd-4a1e-bb38-1c6e5b042d52', '2026-05-01 12:11:43.97425+00'),
	('2d3de848-f265-4c42-93f6-0ca111a52de7', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '2b5d90e9-909d-4230-a851-bc99ba4d5938', '2026-05-01 12:11:43.97425+00'),
	('af221a25-92c6-4b93-97bc-2e34f7f3a233', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '625a72c8-928c-4cf4-a210-6905b1f30179', '2026-05-01 12:11:43.97425+00'),
	('ce68f0d2-4633-435b-94fd-34b358e0c2d9', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'e1e6b0aa-be88-43a3-86b6-6f42dafc2d9d', '2026-05-01 12:11:43.97425+00'),
	('613cd31a-00a1-4c31-a6f0-b8c738fc17a6', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '17fa2ab8-4a8d-4938-b85d-bdc48dc60b6b', '2026-05-01 12:11:43.97425+00'),
	('3aace77c-2688-492d-9bf4-f18043f31f18', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'd2f10bde-0384-4c79-a523-c242ac264bab', '2026-05-01 12:11:43.97425+00'),
	('a8b7ba98-c976-4b24-a391-70eeeaa3b278', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'd4619178-0196-4240-aa58-824823bff0e7', '2026-05-01 12:11:43.97425+00'),
	('76bd7b03-a0f1-4c69-bc0f-3fce3e2435df', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'a525e820-4234-455c-b7f7-ca8655e6aaba', '2026-05-01 12:11:43.97425+00'),
	('0959a751-1817-43b4-af18-33de717efa98', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '2029d17f-f90e-433c-b393-094415da8392', '2026-05-01 12:11:43.97425+00'),
	('e7a0d914-a813-487c-b10f-3eb431a44cc5', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'd70d979e-3d0a-4dea-ad86-1d2d97867371', '2026-05-01 12:11:43.97425+00'),
	('21636767-c9ab-4b38-bca2-3f8a9bd50b37', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'ce7deeac-6617-4dfe-8e17-1b69b6e512af', '2026-05-01 12:11:43.97425+00'),
	('381b209b-bf25-4b55-b5a3-6a6a50b4feed', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '5f8d13fe-2038-48a4-ac8f-02ee26738113', '2026-05-01 12:11:43.97425+00'),
	('aea34b15-05f1-45e7-8b3c-d8a8610b2553', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '7db30572-5136-4a3a-b110-2c8028d9cea9', '2026-05-01 12:11:43.97425+00'),
	('7441c0c6-d027-4cc8-8ad7-a864a39b0fbc', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '1e751c7b-57c7-4dba-838b-2e94545dcfa7', '2026-05-01 12:11:43.97425+00'),
	('38d44a33-849c-48fb-889a-153118c5c371', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '1279daf1-90df-4e56-8531-6bff0d1d30ea', '2026-05-01 12:11:43.97425+00'),
	('9f164a05-21a8-488d-ba2b-3b25615c7c5f', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'dba9ee01-4d0b-4d6b-9de4-44a9cda0fae6', '2026-05-01 12:11:43.97425+00'),
	('fe1af7d9-bced-4138-bb9b-a4a86004b5a9', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '64d4af41-e785-4767-90f4-61155fde3bb3', '2026-05-01 12:11:43.97425+00'),
	('3f33eee6-0b7e-4879-ad28-42a884ea9e6b', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'a801a4e9-fbf6-4fb3-8462-741d95dd9489', '2026-05-01 12:11:43.97425+00'),
	('30691c61-32f2-42c0-8916-3c56e76075b6', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'd0140bcd-3f83-4a42-a742-59912a1bf320', '2026-05-01 12:11:43.97425+00'),
	('6c77d486-5ad5-4b8c-a3c1-d0f10afffcc3', '76edddfe-0919-4758-9adc-e79e5f0c96d2', 'ca1cbbfe-ad1d-4faa-b484-45ceb37fcb8d', '2026-05-01 12:11:43.97425+00'),
	('daf5f17e-d596-41c2-a0d9-6260e9a14903', '76edddfe-0919-4758-9adc-e79e5f0c96d2', '9304f5a3-1a60-451c-b392-9986aeb451a8', '2026-05-01 12:11:43.97425+00'),
	('755b0e0c-0ba9-4dd2-8889-7471c1669a23', 'a94722aa-daa4-4e82-8630-6f8c0e644744', '47f46292-9827-4eae-85db-68fb69f5f6b7', '2026-05-01 12:11:43.97425+00'),
	('ae849829-e209-4925-ad90-aa71dd944272', 'a94722aa-daa4-4e82-8630-6f8c0e644744', '68eedca9-8a0c-41bd-952d-378cdd781749', '2026-05-01 12:11:43.97425+00'),
	('45e43dff-97a6-4275-9d3d-7ded669ffcc0', 'a94722aa-daa4-4e82-8630-6f8c0e644744', 'bb973bc7-dfdd-4a1e-bb38-1c6e5b042d52', '2026-05-01 12:11:43.97425+00'),
	('ead52719-9763-4f3d-9623-789d9965f2d5', 'a94722aa-daa4-4e82-8630-6f8c0e644744', 'e1e6b0aa-be88-43a3-86b6-6f42dafc2d9d', '2026-05-01 12:11:43.97425+00'),
	('767703dc-9bcc-486a-b96b-38454f3cbbe1', 'a94722aa-daa4-4e82-8630-6f8c0e644744', '17fa2ab8-4a8d-4938-b85d-bdc48dc60b6b', '2026-05-01 12:11:43.97425+00'),
	('76e72b77-523f-4fcf-b8c4-9fe8f6dc3bea', 'a94722aa-daa4-4e82-8630-6f8c0e644744', 'd2f10bde-0384-4c79-a523-c242ac264bab', '2026-05-01 12:11:43.97425+00'),
	('4f859079-b526-49eb-b590-bb8f129e351a', 'a94722aa-daa4-4e82-8630-6f8c0e644744', 'd4619178-0196-4240-aa58-824823bff0e7', '2026-05-01 12:11:43.97425+00'),
	('c3c42c6e-b4ac-48b7-b82e-df1539149414', 'a94722aa-daa4-4e82-8630-6f8c0e644744', 'dba9ee01-4d0b-4d6b-9de4-44a9cda0fae6', '2026-05-01 12:11:43.97425+00'),
	('d155d76d-f6bf-4f90-86d9-d26a48433740', '53ce5f1c-f823-4680-8c1c-3e476ab58a6f', 'bb973bc7-dfdd-4a1e-bb38-1c6e5b042d52', '2026-05-01 12:11:43.97425+00'),
	('7fb8eaa1-265e-4926-b6da-5a4b6f28a0a8', '53ce5f1c-f823-4680-8c1c-3e476ab58a6f', '2b5d90e9-909d-4230-a851-bc99ba4d5938', '2026-05-01 12:11:43.97425+00'),
	('61317e39-4a55-49a3-b52b-e86015732502', '53ce5f1c-f823-4680-8c1c-3e476ab58a6f', '17fa2ab8-4a8d-4938-b85d-bdc48dc60b6b', '2026-05-01 12:11:43.97425+00');


--
-- Data for Name: scheduling_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."scheduling_templates" ("id", "name", "description", "is_active", "created_at") VALUES
	('8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 'Default Weekday Roster', 'Standard staffing for business hours', true, '2026-03-16 01:35:29.221371+00'),
	('faea10a6-62d6-4546-a824-0b0a1524ded4', 'Worship Team', NULL, true, '2026-03-17 00:15:14.708793+00'),
	('48fb1545-99e5-4ddd-af8f-edefcfae6df2', 'Summer', NULL, true, '2026-03-24 14:06:16.895752+00'),
	('1ca6a3c1-e2d2-433e-94d0-a5b491123957', 'hyt', NULL, true, '2026-03-24 14:07:28.553938+00');


--
-- Data for Name: staff_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."staff_groups" ("id", "name", "description", "created_at") VALUES
	('d0b9c212-b10c-4bdf-bca7-a333f6147f0e', 'Technical Support', 'IT equipment, network, and device management', '2026-03-16 02:16:36.296714+00'),
	('c7165c23-6fe2-44cb-b0d2-14403ddab7e8', 'Kitchen & Nutrition', 'Meal preparation and cleanliness', '2026-03-16 02:16:36.296714+00'),
	('ec3f70ba-4318-48c4-93b0-bc49b88b2495', 'Admin Operations', 'Office management and logistics', '2026-03-16 02:16:36.296714+00'),
	('0c22ed26-6426-4b55-9285-ad8878342bd3', 'Security', 'Premises safety and check-in assistance', '2026-03-16 02:16:36.296714+00'),
	('8cc04244-7770-41c0-b8e9-f0f98523e703', 'Academic Lead', 'Core curriculum and teaching leads', '2026-03-16 02:16:36.296714+00'),
	('ea2a5d51-68ad-49ce-a296-05cf6fcbd6df', 'Worship Team', 'GVA Worship Team', '2026-03-16 02:48:02.72217+00');


--
-- Data for Name: volunteer_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."volunteer_roles" ("id", "ministry_id", "name", "description", "skills_required", "created_at", "updated_at") VALUES
	('81726ac7-82f9-4c84-a5dd-ca0b7a35a6f0', '0b5cbf07-6efc-450e-bc3b-b2accbc7770c', 'Greeters', '', '{}', '2026-03-20 05:31:41.788509+00', '2026-03-20 05:31:41.788509+00');


--
-- Data for Name: scheduling_requirement_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."scheduling_requirement_items" ("id", "template_id", "day_of_week", "start_time", "end_time", "role_type", "class_id", "required_count", "created_at", "required_group_id", "ministry_id", "volunteer_role_id") VALUES
	('4b732c2a-e398-4731-ab3a-d2dfbba440ac', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 1, '08:00:00', '12:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('7fe84181-6fed-4924-9b52-09c8ea583e57', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 1, '13:00:00', '17:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('44e253df-c43f-4560-b2bf-a58a02c53405', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 1, '09:00:00', '15:00:00', 'assistant', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('c2f37071-49ca-4c9d-9cd5-c2041c066678', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 2, '08:00:00', '12:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('54902eb0-2197-43e9-97d0-5b6baff2346d', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 2, '13:00:00', '17:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('d0fa4fe2-15ad-49fb-9a34-d483cb298ef8', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 2, '09:00:00', '15:00:00', 'assistant', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('7688ee39-e51a-409c-ab92-1d2c18d444c7', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 3, '08:00:00', '12:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('3dd186a2-c250-48f5-a917-8f84b9b9ac95', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 3, '13:00:00', '17:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('0fb60da8-8fed-4350-a268-598a38a8f290', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 3, '09:00:00', '15:00:00', 'assistant', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('a4eeb081-af8f-49bb-96c4-387376a4a90d', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 4, '08:00:00', '12:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('590635ec-3d60-4d8a-9439-6cd3c3fa5735', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 4, '13:00:00', '17:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('a02061db-085c-414d-be07-9c611fae3623', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 4, '09:00:00', '15:00:00', 'assistant', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('f13c3d37-3b38-4ecf-98fc-864ea61c524b', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 5, '08:00:00', '12:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('2dd756a3-ce4a-4bf5-bd94-fd1430271839', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 5, '13:00:00', '17:00:00', 'leader', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('cfb70bfb-74a1-4a48-9ce3-998a98ce4f88', '8fe32a02-ff2a-495b-a6f3-b1d8688cb1a2', 5, '09:00:00', '15:00:00', 'assistant', NULL, 1, '2026-03-16 01:35:29.221371+00', NULL, NULL, NULL),
	('5065f289-e571-41bc-91c8-ceb2fefcfda5', 'faea10a6-62d6-4546-a824-0b0a1524ded4', 0, '09:00:00', '17:00:00', 'volunteer', NULL, 1, '2026-03-17 00:15:50.806097+00', 'ea2a5d51-68ad-49ce-a296-05cf6fcbd6df', NULL, NULL),
	('853d702e-a9e1-48ec-b32a-0bcd5fa8f5d3', '48fb1545-99e5-4ddd-af8f-edefcfae6df2', 1, '09:00:00', '17:00:00', 'volunteer', NULL, 1, '2026-03-24 14:06:48.364711+00', NULL, NULL, NULL),
	('d9a5d8be-9b68-4d6f-9b4e-529bbd9b3864', '48fb1545-99e5-4ddd-af8f-edefcfae6df2', 2, '09:00:00', '17:00:00', 'volunteer', NULL, 1, '2026-03-24 14:07:01.246943+00', '8cc04244-7770-41c0-b8e9-f0f98523e703', '0b5cbf07-6efc-450e-bc3b-b2accbc7770c', NULL);


--
-- Data for Name: security_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."security_attempts" ("id", "ip_address", "user_id", "action", "status", "metadata", "created_at") VALUES
	('ee42500d-1c58-4f56-8029-c19fa0c43f67', NULL, '2cf038b9-160e-414e-b800-1353cd2a0370', 'staff_pin_verify', 'success', '{"staff_id": "8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa"}', '2026-05-01 13:16:34.26743+00');


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."shifts" ("id", "staff_id", "class_id", "start_time", "end_time", "status", "role_type", "notes", "created_at", "updated_at", "actual_start_time", "actual_end_time", "kiosk_id", "event_id", "volunteer_role_id", "ministry_id") VALUES
	('9a3f9761-7c1a-44b3-9e09-8daea039782d', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', '1a033672-21e8-416a-a039-26bf26a8f08a', '2026-03-15 09:00:00+00', '2026-03-15 17:00:00+00', 'scheduled', 'leader', '', '2026-03-16 02:37:34.860007+00', '2026-03-16 02:37:34.860007+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('83a6bb7e-b5b7-4d75-89ba-adacc9792092', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', NULL, '2026-03-16 08:00:00+00', '2026-03-16 12:00:00+00', 'scheduled', 'leader', NULL, '2026-03-17 00:14:35.977301+00', '2026-03-17 00:14:35.977301+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('b8c3dd26-0231-4fd2-93d6-05f21073e9ce', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2026-03-16 13:00:00+00', '2026-03-16 17:00:00+00', 'scheduled', 'leader', NULL, '2026-03-17 00:14:35.977301+00', '2026-03-17 00:14:35.977301+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('a99c8b8a-b2a7-4282-9cb1-a705d7b3f93c', '48394295-9c6a-4688-90f4-896593753730', NULL, '2026-03-16 09:00:00+00', '2026-03-16 15:00:00+00', 'scheduled', 'assistant', NULL, '2026-03-17 00:14:35.977301+00', '2026-03-17 00:14:35.977301+00', NULL, NULL, NULL, NULL, NULL, NULL),
	('092440fa-9188-4cfc-9985-5e13e16fcbac', 'c552444f-f201-41f9-91c4-09daef2405f3', NULL, '2026-03-24 09:00:00+00', '2026-03-24 17:00:00+00', 'scheduled', 'volunteer', NULL, '2026-03-24 14:08:13.616164+00', '2026-03-24 14:08:13.616164+00', NULL, NULL, NULL, NULL, NULL, '0b5cbf07-6efc-450e-bc3b-b2accbc7770c');


--
-- Data for Name: staff_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."staff_documents" ("id", "user_id", "document_type", "document_name", "file_path", "file_size", "description", "status", "uploaded_at", "reviewed_at", "reviewed_by", "rejection_reason", "expires_at", "created_at", "updated_at") VALUES
	('e4cb0ff5-93ca-423e-ae5d-bcffdfb73090', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'first_aid_cert', 'wisdom-salami-resume.pdf', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3/1773094963037_wisdom-salami-resume.pdf', 88020, NULL, 'approved', '2026-03-09 22:22:44.036558+00', '2026-03-09 22:23:40.416+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2028-03-09 00:00:00+00', '2026-03-09 22:22:44.036558+00', '2026-03-09 22:22:44.036558+00'),
	('8f6871ce-ad6c-4c87-9fc4-ec38311211a0', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'reference_letter', 'wisdom-salami-resume.pdf', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3/1773094943390_wisdom-salami-resume.pdf', 88020, NULL, 'approved', '2026-03-09 22:22:24.422616+00', '2026-03-09 22:23:43.669+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, NULL, '2026-03-09 22:22:24.422616+00', '2026-03-09 22:22:24.422616+00'),
	('3203503f-6693-463d-b89e-fb7b0bc4b8c4', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'child_protection_cert', 'Profile.pdf', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3/1773093819339_Profile.pdf', 70584, NULL, 'approved', '2026-03-09 22:03:40.342992+00', '2026-03-09 22:23:49.67+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2028-03-09 00:00:00+00', '2026-03-09 22:03:40.342992+00', '2026-03-09 22:03:40.342992+00'),
	('b129dabf-0407-432d-8b8d-8ad29968ffb3', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'police_check', 'Profile.pdf', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3/1773093745524_Profile.pdf', 70584, NULL, 'approved', '2026-03-09 22:02:26.495252+00', '2026-03-09 22:23:54.547+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2027-03-09 00:00:00+00', '2026-03-09 22:02:26.495252+00', '2026-03-09 22:02:26.495252+00'),
	('a6e8102a-f952-4223-9663-1d5630615b6d', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'child_protection_cert', 'training-certificate-Jon Goss.pdf', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2/1773591585683_training-certificate-Jon Goss.pdf', 39419, 'Ministry Safe Training completed on September 9, 2025', 'approved', '2026-03-15 16:19:47.328052+00', '2026-03-16 01:29:43.235+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', NULL, '2027-09-09 00:00:00+00', '2026-03-15 16:19:47.328052+00', '2026-03-15 16:19:47.328052+00');


--
-- Data for Name: staff_group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."staff_group_members" ("group_id", "profile_id", "created_at") VALUES
	('ea2a5d51-68ad-49ce-a296-05cf6fcbd6df', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-16 02:48:40.863411+00'),
	('d0b9c212-b10c-4bdf-bca7-a333f6147f0e', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', '2026-03-16 02:49:22.937266+00');


--
-- Data for Name: staff_group_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."staff_group_rules" ("id", "group_id", "attribute_type", "attribute_value", "created_at") VALUES
	('0662f5f6-3073-43be-a7bb-83adebe8cef5', '8cc04244-7770-41c0-b8e9-f0f98523e703', 'role', 'teacher', '2026-03-16 02:18:30.046955+00'),
	('90e1caaa-888d-4750-9063-548815355c35', '8cc04244-7770-41c0-b8e9-f0f98523e703', 'role', 'teacher_assistant', '2026-03-16 02:18:30.046955+00'),
	('ee3d0f78-b5e3-40ef-a09e-543c2f4ba3f3', 'd0b9c212-b10c-4bdf-bca7-a333f6147f0e', 'department', 'IT', '2026-03-16 02:18:30.046955+00'),
	('b0b40eee-419b-487b-9fff-445b4829653f', 'd0b9c212-b10c-4bdf-bca7-a333f6147f0e', 'department', 'Tech', '2026-03-16 02:18:30.046955+00');


--
-- Data for Name: staff_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teachers" ("id", "user_id", "class_id", "created_at", "updated_at") VALUES
	('07ea33e2-1faa-4739-92fb-d3cd6bf7ea58', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', '72984069-6f33-4505-a672-287cfa967323', '2026-03-10 01:44:03.724535+00', '2026-03-10 01:44:03.724535+00');


--
-- Data for Name: user_custom_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at", "is_super_admin", "is_volunteer", "verification_status", "verified_at", "verified_by", "verification_notes", "custom_role_id") VALUES
	('0b57a47a-f4c2-404b-bfbd-15033251a209', '48394295-9c6a-4688-90f4-896593753730', 'staff', '2026-03-16 23:43:40.34751+00', false, false, 'unverified', NULL, NULL, NULL, NULL),
	('ef928581-7009-4823-8cf0-95d74bd3bf5e', '8883cae6-aa26-4103-89a7-3d6bcef7cefc', 'parent', '2026-03-21 03:30:53.814114+00', false, false, 'unverified', NULL, NULL, NULL, NULL),
	('9104db46-d0e5-4f18-a84e-9d86d80d67d7', '4201caa1-b9f3-4514-9647-031e9e929be6', 'regular_user', '2026-03-21 22:05:14.980435+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('5ed9ec37-0533-45f8-a5ae-ef570e15312c', 'c552444f-f201-41f9-91c4-09daef2405f3', 'teacher', '2026-03-21 22:01:10.78936+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('2672fb2c-de20-4837-9d9d-83bef772bc40', '2cf038b9-160e-414e-b800-1353cd2a0370', 'kiosk', '2026-04-29 19:52:04.857052+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('6781af3c-c290-4b50-bf31-4e74a5130a6a', 'b7d060ac-2044-4ffb-8ba3-de46d183c05a', 'kiosk', '2026-04-29 23:08:55.519333+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('40798946-1349-423c-833d-fb3be2e69e9c', '4f102c68-f2d1-4111-90cb-4e587ede99ee', 'parent', '2026-04-29 23:50:58.81943+00', false, false, 'unverified', NULL, NULL, NULL, NULL),
	('69c120b7-e567-4a5b-8055-9e86b254d1fd', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'parent', '2025-08-02 18:59:15.958736+00', false, false, 'verified', '2026-02-25 02:22:04.491613+00', NULL, NULL, NULL),
	('4b37b8d8-c34d-441f-af9e-ffef54190cb7', '0b90bed6-9260-4705-808f-ca61de570d90', 'parent', '2026-02-24 17:40:47.186278+00', false, false, 'verified', '2026-02-25 02:22:04.491613+00', NULL, NULL, NULL),
	('05a054ce-6c14-475a-bcc4-b092b5a99723', '9955bf52-fdb6-46f1-8fb8-56a97b2fad8a', 'parent', '2026-03-07 13:23:42.397054+00', false, false, 'unverified', NULL, NULL, NULL, NULL),
	('d0f71f30-e0f3-49ee-a4ec-21d377e2f1e6', 'ce29ae44-edfe-481c-a5ee-a5fbc78dff84', 'kiosk', '2026-03-09 06:55:25.874619+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('24ade59c-00a6-4448-acde-cf8073f820ac', '8eb76649-9037-40b7-a305-69a3f0e185a4', 'kiosk', '2026-03-09 07:18:36.855898+00', false, false, 'verified', NULL, NULL, NULL, NULL),
	('be601caa-ba25-468c-8d83-39aba1b055b4', '6f35c5e6-e56b-4590-bd3c-f50d7d4dcea6', 'kiosk', '2026-03-10 17:44:47.873646+00', false, false, 'verified', '2026-03-10 17:44:47.873646+00', NULL, NULL, NULL),
	('3630d711-fd47-4370-95f7-6ed6987f5988', 'beeb1e9b-0cc2-4570-8f4e-89b57f682d23', 'parent', '2026-03-15 19:53:11.310351+00', false, false, 'unverified', NULL, NULL, NULL, NULL),
	('8d4d8796-a71f-49e5-b8e8-7b25998a3869', '2a01e064-ccb9-4202-a588-2fb7a7bb74b2', 'staff', '2026-03-15 14:17:44.418817+00', false, false, 'verified', '2026-03-16 01:29:46.328153+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Approved by administrator', NULL),
	('f88ef52a-b1d6-4679-a8a2-d0cc892774bc', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', 'teacher', '2026-03-09 15:15:25.219019+00', false, false, 'verified', '2026-03-09 23:24:32.836889+00', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'Approved by administrator', NULL),
	('afd7cf2e-2dbd-4754-bd93-3afabf094707', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'super_admin', '2025-08-02 18:55:21.382673+00', true, false, 'verified', '2026-03-09 03:41:39.802679+00', NULL, NULL, NULL);


--
-- Data for Name: user_security_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: visitor_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."visitor_interactions" ("id", "visitor_id", "interaction_type", "content", "created_by", "created_at") VALUES
	('03461c14-ed5c-4552-bcaf-01da192c7c52', '0b90bed6-9260-4705-808f-ca61de570d90', 'note', 'Started: Visitor Welcome Journey', NULL, '2026-03-20 07:52:16.886222+00'),
	('f7f91c59-d557-47fd-9429-663cc1d33467', '0b90bed6-9260-4705-808f-ca61de570d90', 'note', 'Promoted to Official Member', NULL, '2026-03-20 18:23:28.632172+00'),
	('54326525-a5c4-40d9-a3fb-cecf49ef3e41', '0b90bed6-9260-4705-808f-ca61de570d90', 'note', 'This is a test note for this user', NULL, '2026-03-20 23:32:05.301777+00'),
	('6c04991f-9f51-4cd1-8772-a5316c91d999', '0b90bed6-9260-4705-808f-ca61de570d90', 'note', 'll', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-20 23:57:25.648736+00'),
	('f95ed6c0-8d88-4628-945b-368d6f6dd315', 'e057b71e-b198-4fd8-aa60-0f9a6ba9b9c9', 'note', 'This is a test Message ', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-21 03:26:11.584856+00'),
	('d158b586-0bb8-4ddf-8b1a-1cc4eb5ff8b2', 'c552444f-f201-41f9-91c4-09daef2405f3', 'note', 'Started: Visitor Welcome Journey', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-21 22:01:11.114526+00'),
	('7893fe07-6415-4c9b-bde8-d589cda8c413', '4201caa1-b9f3-4514-9647-031e9e929be6', 'note', 'Started: Visitor Welcome Journey', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-21 22:05:15.592929+00'),
	('95efd98b-1b7b-418b-9f22-73fad5ea6ff2', '4201caa1-b9f3-4514-9647-031e9e929be6', 'note', 'This is a test', '8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', '2026-03-22 00:21:52.854861+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1164, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;


SET session_replication_role = 'origin';
