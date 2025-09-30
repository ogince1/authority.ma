SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '5ac7605c-2e94-4665-afca-4aac1278d213', '{"action":"user_confirmation_requested","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-27 10:30:31.147369+00', ''),
	('00000000-0000-0000-0000-000000000000', '7a6b8017-94b1-4d56-acf4-ee8c7603d2fd', '{"action":"user_signedup","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-07-27 10:30:56.895658+00', ''),
	('00000000-0000-0000-0000-000000000000', '96773e48-66a4-41ff-af1d-7e4844eb68ca', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-27 10:31:32.338334+00', ''),
	('00000000-0000-0000-0000-000000000000', '70dbe2eb-5833-454c-a2e3-b4c548399048', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-27 10:36:06.285878+00', ''),
	('00000000-0000-0000-0000-000000000000', '223e7fe4-a9d2-45fb-89c1-5cf105389d00', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-27 10:41:00.080433+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b1c2964-8cda-4204-b9a2-024c1debd15d', '{"action":"user_confirmation_requested","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2025-07-27 10:51:24.458591+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cc6f6dca-602f-42a6-91dd-cc45d658abdf', '{"action":"user_signedup","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-07-27 10:51:50.179445+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed929e37-5ba6-4a49-9cba-ce82ef83916f', '{"action":"token_refreshed","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-27 15:46:16.686405+00', ''),
	('00000000-0000-0000-0000-000000000000', '19a2586f-aa0c-47dd-9226-136967c56f42', '{"action":"token_revoked","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-27 15:46:16.706584+00', ''),
	('00000000-0000-0000-0000-000000000000', '97e4c6f1-0b2e-4396-9ad4-d2e22925f810', '{"action":"token_refreshed","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-27 16:46:06.357029+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd482112b-5cd8-4f0c-be83-5ce68a5e10cb', '{"action":"token_revoked","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-27 16:46:06.380056+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b24456b3-42a0-40d7-9e0d-0ab85dc08fa9', '{"action":"token_refreshed","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 08:05:12.242384+00', ''),
	('00000000-0000-0000-0000-000000000000', '814ac74e-d7ac-4387-a64e-15769172c34e', '{"action":"token_revoked","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 08:05:12.25384+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eeb85eb1-2dea-455c-b333-812c477062e6', '{"action":"token_refreshed","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 15:25:14.665642+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f72b1aec-d09e-445b-95b8-9e468c522907', '{"action":"token_revoked","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-28 15:25:14.690776+00', ''),
	('00000000-0000-0000-0000-000000000000', '4062b11f-0aeb-44e3-ac7a-529c501546a2', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-29 10:05:01.69945+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ee3340ff-5407-4664-b9d5-9179dbb35d72', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 11:13:53.241039+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f563f5f-ee2b-4671-8e8e-a9b6ab432c3c', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 11:13:53.255244+00', ''),
	('00000000-0000-0000-0000-000000000000', '6549ecb5-2d3d-4565-8e4e-bb7b8a907438', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-29 11:35:32.259564+00', ''),
	('00000000-0000-0000-0000-000000000000', '3615187d-a913-4cb9-b7b3-654326b10365', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 12:33:48.352193+00', ''),
	('00000000-0000-0000-0000-000000000000', '7225486d-75e3-40e4-a1d2-6c75f2a9cde5', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 12:33:48.370088+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bebfd34e-c5f8-45d3-8256-9de671c5f495', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 12:34:44.650959+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c169fb73-e8ef-4b7f-8635-8a8b5a4a95a0', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-29 12:34:44.651606+00', ''),
	('00000000-0000-0000-0000-000000000000', '9befd447-d471-48fb-b540-0645ac0a46a0', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-29 13:14:47.61439+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cd48f2b-b188-4f61-8a75-9a95c03d50cb', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 08:54:56.793239+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b4513a46-ebe2-465d-9196-d34148bdce25', '{"action":"login","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 09:16:10.823448+00', ''),
	('00000000-0000-0000-0000-000000000000', '1e0cbab3-ff2d-477b-8e67-3218bcf9349c', '{"action":"logout","actor_id":"ad3a68d0-b6f9-4714-8043-e25a42eb2b36","actor_username":"abderrahimmolatefpro@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-30 09:17:24.143708+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f03616ec-c4f9-4ea1-96d9-f248ed758ac3', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 09:17:36.980705+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f19a3bb-cd2f-4c96-8874-89e4e0a5f3b3', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-30 09:18:31.251139+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c94aea7c-2940-4f7c-81d0-9f95923734f5', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 09:18:46.397043+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2021cd8-f194-49c0-be20-eb3f46bf912c', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-30 10:16:02.404359+00', ''),
	('00000000-0000-0000-0000-000000000000', '864dd139-3cd0-4c43-852e-824d9d45682f', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 11:41:18.484222+00', ''),
	('00000000-0000-0000-0000-000000000000', '44ec1443-2e9c-40b8-b958-cc2d09df18a3', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 14:21:44.328245+00', ''),
	('00000000-0000-0000-0000-000000000000', '03a58d98-3a52-4709-a588-c656812faa19', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 14:21:44.35532+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a29f2b3-5429-4477-a575-17fdca61383d', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 20:08:24.490421+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ce9c09e0-3cc1-4e27-8b03-0a26cdcdba36', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-30 20:08:24.516712+00', ''),
	('00000000-0000-0000-0000-000000000000', '4c95ddac-a05d-4981-831c-e149141886d8', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-07-30 20:50:01.188536+00', ''),
	('00000000-0000-0000-0000-000000000000', '434db7ee-8d30-4151-b6ef-46a526611e01', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 07:27:24.776123+00', ''),
	('00000000-0000-0000-0000-000000000000', '84b11d8f-59b4-4cb6-b75c-de3d153b2bfd', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 07:27:24.791884+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd09c1940-e70c-41da-9ec0-680dfd824a70', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:58:58.447574+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad71ca9a-6fa8-4e22-b267-696d84421928', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 08:58:58.475572+00', ''),
	('00000000-0000-0000-0000-000000000000', '66e6da29-b2dc-4a81-aa11-42c8ca3f30d6', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 10:49:20.076207+00', ''),
	('00000000-0000-0000-0000-000000000000', '2eb48ab2-9eda-4e10-a677-5a57c5e5243b', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 10:49:20.099625+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f43f65c-071c-42dd-9f16-09b92578c9c4', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 18:45:05.11021+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a013bc5-f4b8-4cc1-802e-d3ced915d96e', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 18:45:05.131282+00', ''),
	('00000000-0000-0000-0000-000000000000', 'abebf35a-8b0b-4371-9aa2-c1b2f96bda35', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 19:47:31.857326+00', ''),
	('00000000-0000-0000-0000-000000000000', '049a122a-b488-4abb-b17f-e2df943495b8', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-31 19:47:31.877501+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bbdd3ae5-8594-494d-ac0c-6a07bfc20ed6', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 07:04:26.70146+00', ''),
	('00000000-0000-0000-0000-000000000000', '0c90e077-a897-4adb-87e3-eedbdebc8e64', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-01 07:04:26.72495+00', ''),
	('00000000-0000-0000-0000-000000000000', '660bd53c-a12a-44f2-8ef2-b76ce21dcaa1', '{"action":"logout","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-08-01 07:05:03.890709+00', ''),
	('00000000-0000-0000-0000-000000000000', '7dcc56f3-ccdc-4b45-8d91-ffd02d35171d', '{"action":"login","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-08-02 07:58:42.097126+00', ''),
	('00000000-0000-0000-0000-000000000000', '4704a984-38f0-4a19-a5b3-689b63b06a8d', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 09:07:54.892236+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de47fa5c-2820-47c7-957d-55e1cc2e0ff3', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 09:07:54.91372+00', ''),
	('00000000-0000-0000-0000-000000000000', '546de43f-bdc3-4df1-b495-d7cf53dc61aa', '{"action":"token_refreshed","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 10:08:47.685515+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d01a599-d863-43e1-a349-d2ddae13be02', '{"action":"token_revoked","actor_id":"ac9257c4-5241-455a-a268-5fa3a36ee3a9","actor_username":"ogincema@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-08-02 10:08:47.697021+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'ad3a68d0-b6f9-4714-8043-e25a42eb2b36', 'authenticated', 'authenticated', 'abderrahimmolatefpro@gmail.com', '$2a$10$ylzJ8jhrJFgxyRKMf4p6oOHbrP2Evz1DfRThSmJoghCRiBe1IXdne', '2025-07-27 10:51:50.180037+00', NULL, '', '2025-07-27 10:51:24.461288+00', '', NULL, '', '', NULL, '2025-07-30 09:16:10.836385+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "ad3a68d0-b6f9-4714-8043-e25a42eb2b36", "name": "ABDERRAHIM MOLATEF", "role": "advertiser", "email": "abderrahimmolatefpro@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-07-27 10:51:24.435264+00', '2025-07-30 09:16:10.858856+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'authenticated', 'authenticated', 'ogincema@gmail.com', '$2a$10$HbShdrIJNCDFIWVbBpkh7uGyb3JLKOAIwwH6wToSWcpR2n0b77aqW', '2025-07-27 10:30:56.896294+00', NULL, '', '2025-07-27 10:30:31.156837+00', '', NULL, '', '', NULL, '2025-08-02 07:58:42.122626+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "ac9257c4-5241-455a-a268-5fa3a36ee3a9", "name": "ABDERRAHIM MOLATEF", "role": "entrepreneur", "email": "ogincema@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2025-07-27 10:30:31.077954+00', '2025-08-02 10:08:47.719639+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '{"sub": "ac9257c4-5241-455a-a268-5fa3a36ee3a9", "name": "ABDERRAHIM MOLATEF", "role": "entrepreneur", "email": "ogincema@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-07-27 10:30:31.120375+00', '2025-07-27 10:30:31.121572+00', '2025-07-27 10:30:31.121572+00', '11d82aef-e5ec-494b-b78d-28e42bddfc15'),
	('ad3a68d0-b6f9-4714-8043-e25a42eb2b36', 'ad3a68d0-b6f9-4714-8043-e25a42eb2b36', '{"sub": "ad3a68d0-b6f9-4714-8043-e25a42eb2b36", "name": "ABDERRAHIM MOLATEF", "role": "advertiser", "email": "abderrahimmolatefpro@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2025-07-27 10:51:24.454677+00', '2025-07-27 10:51:24.454728+00', '2025-07-27 10:51:24.454728+00', '4f42b026-e207-46fa-bf2d-b3803777cd73');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('c430741d-f551-48bf-9ca9-0949bfa97944', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '2025-08-02 07:58:42.124058+00', '2025-08-02 10:08:47.731529+00', NULL, 'aal1', NULL, '2025-08-02 10:08:47.731448', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '197.153.58.157', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('c430741d-f551-48bf-9ca9-0949bfa97944', '2025-08-02 07:58:42.208008+00', '2025-08-02 07:58:42.208008+00', 'password', '68808987-896c-478e-a24a-87472d8a765b');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 27, '2tlvxnpcvi6s', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', true, '2025-08-02 07:58:42.15138+00', '2025-08-02 09:07:54.915067+00', NULL, 'c430741d-f551-48bf-9ca9-0949bfa97944'),
	('00000000-0000-0000-0000-000000000000', 28, 'cfaftjx2dhnd', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', true, '2025-08-02 09:07:54.933322+00', '2025-08-02 10:08:47.700088+00', '2tlvxnpcvi6s', 'c430741d-f551-48bf-9ca9-0949bfa97944'),
	('00000000-0000-0000-0000-000000000000', 29, 'zklew3lodjo3', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', false, '2025-08-02 10:08:47.711418+00', '2025-08-02 10:08:47.711418+00', 'cfaftjx2dhnd', 'c430741d-f551-48bf-9ca9-0949bfa97944');


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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "name", "email", "role", "phone", "website", "bio", "company_name", "company_size", "location", "advertiser_info", "publisher_info", "created_at", "updated_at", "balance", "credit_limit") VALUES
	('550e8400-e29b-41d4-a716-446655440001', 'Admin Authority', 'admin@back.ma', 'admin', NULL, NULL, NULL, 'Back.ma', NULL, 'Casablanca, Maroc', NULL, NULL, '2025-07-26 21:35:44.396115+00', '2025-07-26 21:35:44.396115+00', 0.00, NULL),
	('550e8400-e29b-41d4-a716-446655440002', 'Mohammed Alami', 'mohammed@example.com', 'publisher', NULL, NULL, NULL, 'Blog Tech Maroc', NULL, 'Rabat, Maroc', NULL, NULL, '2025-07-26 21:35:44.396115+00', '2025-07-26 21:35:44.396115+00', 0.00, NULL),
	('550e8400-e29b-41d4-a716-446655440003', 'Fatima Bennani', 'fatima@example.com', 'advertiser', NULL, NULL, NULL, 'E-commerce Plus', NULL, 'Marrakech, Maroc', NULL, NULL, '2025-07-26 21:35:44.396115+00', '2025-07-26 21:35:44.396115+00', 0.00, NULL),
	('a4eeff03-a1fa-4097-89f7-207e21f70ecb', 'Ahmed Benali', 'ahmed@techblog.ma', 'publisher', '+212 6 12 34 56 78', 'https://techblog.ma', 'Blogueur tech passionné par l''innovation au Maroc', 'TechBlog.ma', 'startup', 'Casablanca, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('40bc053e-4d22-45f8-8d25-177d3ab565e3', 'Fatima Zahra', 'fatima@lifestyle.ma', 'publisher', '+212 6 23 45 67 89', 'https://lifestyle.ma', 'Influenceuse lifestyle et bien-être', 'Lifestyle.ma', 'startup', 'Rabat, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('79842797-dcb4-402d-9e6e-92405d306d05', 'Karim Tazi', 'karim@business.ma', 'publisher', '+212 6 34 56 78 90', 'https://business.ma', 'Expert en business et entrepreneuriat', 'Business.ma', 'sme', 'Marrakech, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('4fd200d8-9540-4399-8535-625a00c63e27', 'Sara Alami', 'sara@startup.ma', 'advertiser', '+212 6 45 67 89 01', 'https://startup.ma', 'Fondatrice d''une startup tech', 'StartupTech', 'startup', 'Casablanca, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('54285e16-9188-480f-aced-29642a0e0ee0', 'Youssef Idrissi', 'youssef@agency.ma', 'advertiser', '+212 6 56 78 90 12', 'https://agency.ma', 'Directeur d''agence marketing digital', 'DigitalAgency', 'agency', 'Fès, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('abdffddb-14c0-4a98-859e-3f1c1bf2d0a1', 'Amina Benslimane', 'amina@ecommerce.ma', 'advertiser', '+212 6 67 89 01 23', 'https://ecommerce.ma', 'Fondatrice d''une boutique en ligne', 'EcommerceStore', 'sme', 'Agadir, Maroc', NULL, NULL, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00', 0.00, NULL),
	('ad3a68d0-b6f9-4714-8043-e25a42eb2b36', 'ABDERRAHIM MOLATEF', 'abderrahimmolatefpro@gmail.com', 'admin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-27 10:58:26.776+00', '2025-07-27 11:05:14.409502+00', 0.00, NULL),
	('ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'ABDERRAHIM MOLATEF', 'ogincema@gmail.com', 'advertiser', '+212706404147', '', '', NULL, NULL, NULL, NULL, NULL, '2025-07-29 10:05:44.06+00', '2025-07-31 20:12:37.403676+00', 1900.02, NULL);


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."blog_posts" ("id", "title", "slug", "excerpt", "content", "featured_image", "images", "category", "tags", "status", "meta_title", "meta_description", "author_id", "published_at", "created_at", "updated_at") VALUES
	('df1c5c25-9d9b-4667-9392-fbacdceff60c', 'hjlglkj', 'hjlglkj', 'lnmkl=m', 'knùl=ùmkl=nmù', NULL, '{}', 'Entrepreneuriat', '{}', 'published', NULL, NULL, 'ad3a68d0-b6f9-4714-8043-e25a42eb2b36', NULL, '2025-07-27 11:08:07.996+00', '2025-07-27 11:08:15.588667+00');


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."campaigns" ("id", "user_id", "name", "urls", "language", "status", "extracted_metrics", "budget", "total_orders", "total_spent", "created_at", "updated_at") VALUES
	('6af37393-0386-4daa-b293-3ddaa770b64b', 'ad3a68d0-b6f9-4714-8043-e25a42eb2b36', 'Campagne SEO E-commerce', '{https://example.com,https://example.com/products}', 'Français', 'active', NULL, 5000.00, 3, 1200.00, '2025-07-29 11:38:33.46086+00', '2025-07-29 11:38:33.46086+00'),
	('f387aa0e-e44e-4db7-9f5c-ce447414eb6e', 'ad3a68d0-b6f9-4714-8043-e25a42eb2b36', 'Campagne Blog Tech', '{https://techblog.com}', 'Français', 'draft', NULL, 2000.00, 0, 0.00, '2025-07-29 11:38:33.46086+00', '2025-07-29 11:38:33.46086+00'),
	('b98d9ac4-e1a5-493c-86f4-923aeb4f85ed', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'test', '{https://www.krosfou.fr/}', 'Français', 'draft', NULL, 2000.00, 0, 0.00, '2025-07-29 11:39:51.311+00', '2025-07-29 11:39:51.311+00'),
	('a1c655e9-36c0-4ad6-88d5-41cb5b8e9164', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'test', '{https://www.krosfou.fr/}', 'Français', 'draft', NULL, 10000.00, 0, 0.00, '2025-07-30 20:20:48.866+00', '2025-07-30 20:20:48.866+00'),
	('7671ac0e-3c1d-41f5-bb55-17925485ad1f', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'test', '{https://www.krosfou.fr/}', 'Français', 'draft', NULL, 0.00, 0, 0.00, '2025-07-30 20:27:54.733+00', '2025-07-30 20:27:54.733+00'),
	('f03ce95f-ea51-41e2-96db-cc40c5f8cd15', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'tesr', '{https://www.krosfou.fr/}', 'Français', 'draft', NULL, 0.00, 0, 0.00, '2025-07-31 18:47:04.106+00', '2025-07-31 18:47:04.106+00'),
	('d4ba09d9-79b7-43f1-a7f7-31470fcfd11d', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'test', '{https://www.krosfou.fr/}', 'Français', 'draft', NULL, 0.00, 0, 0.00, '2025-08-02 08:00:35.078+00', '2025-08-02 08:00:35.078+00');


--
-- Data for Name: websites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."websites" ("id", "title", "description", "url", "category", "niche", "owner_status", "metrics", "contact_info", "logo", "screenshots", "meta_title", "meta_description", "slug", "status", "user_id", "available_link_spots", "average_response_time", "payment_methods", "languages", "content_quality", "created_at", "updated_at") VALUES
	('78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'TechBlog.ma', 'Blog technologique marocain couvrant l''innovation, les startups et la tech au Maroc', 'https://techblog.ma', 'blog', 'tech', 'professionnel', '{"alexa_rank": 15000, "page_authority": 40, "backlinks_count": 1200, "monthly_traffic": 50000, "domain_authority": 45, "organic_keywords": 800, "social_followers": 5000, "google_indexed_pages": 150}', '{"email": "contact@techblog.ma", "phone": "+212 6 12 34 56 78", "address": "Casablanca, Maroc"}', 'https://techblog.ma/logo.png', '{https://techblog.ma/screenshot1.jpg,https://techblog.ma/screenshot2.jpg}', 'TechBlog.ma - Blog Tech Marocain', 'Découvrez les dernières innovations technologiques au Maroc', 'techblog-ma', 'active', 'a4eeff03-a1fa-4097-89f7-207e21f70ecb', 5, 24, '{virement,paypal}', '{français,arabe}', 'excellent', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('3ec62077-2d12-4bb2-b755-9c0ca50afc44', 'Lifestyle.ma', 'Blog lifestyle et bien-être pour les femmes marocaines modernes', 'https://lifestyle.ma', 'blog', 'lifestyle', 'professionnel', '{"alexa_rank": 25000, "page_authority": 35, "backlinks_count": 800, "monthly_traffic": 35000, "domain_authority": 38, "organic_keywords": 600, "social_followers": 8000, "google_indexed_pages": 120}', '{"email": "contact@lifestyle.ma", "phone": "+212 6 23 45 67 89", "address": "Rabat, Maroc"}', 'https://lifestyle.ma/logo.png', '{https://lifestyle.ma/screenshot1.jpg}', 'Lifestyle.ma - Blog Lifestyle Marocain', 'Conseils lifestyle et bien-être pour les femmes marocaines', 'lifestyle-ma', 'active', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 3, 12, '{virement,paypal}', '{français,arabe}', 'excellent', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('7c9eabf0-4014-4257-af06-8f3a7d065798', 'Business.ma', 'Portail d''actualités business et entrepreneuriat au Maroc', 'https://business.ma', 'actualites', 'business', 'professionnel', '{"alexa_rank": 8000, "page_authority": 48, "backlinks_count": 2000, "monthly_traffic": 75000, "domain_authority": 52, "organic_keywords": 1200, "social_followers": 12000, "google_indexed_pages": 300}', '{"email": "contact@business.ma", "phone": "+212 6 34 56 78 90", "address": "Marrakech, Maroc"}', 'https://business.ma/logo.png', '{https://business.ma/screenshot1.jpg,https://business.ma/screenshot2.jpg}', 'Business.ma - Actualités Business Maroc', 'Actualités business, entrepreneuriat et économie au Maroc', 'business-ma', 'active', '79842797-dcb4-402d-9e6e-92405d306d05', 8, 6, '{virement,paypal,carte}', '{français,arabe,anglais}', 'excellent', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('280a7497-2d22-4cd2-ada1-fca23a9bca5d', 'OGINCE', 'Agence de Marketing digital,Agence de Marketing digital,', 'https://ogince.ma/', 'tech', 'lifestyle', 'agence', '{"alexa_rank": 0, "page_authority": "0", "backlinks_count": 0, "monthly_traffic": "10000", "domain_authority": "30", "organic_keywords": 0, "google_indexed_pages": 0}', '{"name": "ABDERRAHIM MOLATEF", "email": "ogincema@gmail.com", "phone": "+212706404147", "website": "", "whatsapp": ""}', NULL, '{}', 'OGINCE', 'Agence de Marketing digital,Agence de Marketing digital,', 'ogince', 'pending_approval', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 1, 24, '{"Virement bancaire"}', '{Français}', 'good', '2025-07-30 09:04:31.478686+00', '2025-07-30 09:04:31.478686+00'),
	('2696c870-2e66-4156-ae55-df592376babc', 'jmj', 'iomhmiomhjiùhoùkjlkmmlkjjlkmjkljmkljkmjmlkjmkljmkmhmh', 'https://toutamenager.ma/', 'blog', 'lifestyle', 'particulier', '{"alexa_rank": 0, "page_authority": 0, "backlinks_count": 0, "monthly_traffic": 0, "domain_authority": 0, "organic_keywords": 0, "google_indexed_pages": 0}', '{"name": "ABDERRAHIM MOLATEF", "email": "abderrahimmolatefpro@gmail.com", "phone": "+212706404147", "website": "", "whatsapp": ""}', NULL, '{}', 'jmj', 'iomhmiomhjiùhoùkjlkmmlkjjlkmjkljmkljkmjmlkjmkljmkmhmh', 'jmj', 'active', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 1, 24, '{"Virement bancaire"}', '{Français}', 'good', '2025-07-30 09:05:43.05288+00', '2025-07-30 09:16:57.890609+00');


--
-- Data for Name: link_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."link_listings" ("id", "website_id", "title", "description", "target_url", "anchor_text", "link_type", "position", "price", "currency", "minimum_contract_duration", "max_links_per_page", "allowed_niches", "forbidden_keywords", "content_requirements", "status", "user_id", "meta_title", "meta_description", "slug", "images", "tags", "created_at", "updated_at") VALUES
	('dd7ab0d7-efdb-46ee-ac5f-f3a41b67dbf8', '78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'Lien Dofollow Header TechBlog.ma', 'Lien dofollow de haute qualité dans le header du blog tech marocain', 'https://example.com', 'Startup Tech Maroc', 'dofollow', 'header', 1500.00, 'MAD', 6, 1, '{tech,startup,innovation}', '{casino,porn,pharma}', 'Contenu de qualité sur la tech ou les startups', 'active', 'a4eeff03-a1fa-4097-89f7-207e21f70ecb', 'Lien Dofollow Header TechBlog.ma', 'Lien dofollow de haute qualité dans le header', 'lien-dofollow-header-techblog', '{https://example.com/link1.jpg}', '{dofollow,header,tech}', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('75bd2336-6378-4d30-8f81-27611d7caa94', '3ec62077-2d12-4bb2-b755-9c0ca50afc44', 'Lien Nofollow Article Lifestyle.ma', 'Lien nofollow dans un article lifestyle', 'https://example.com', 'Mode Marocaine', 'nofollow', 'content', 800.00, 'MAD', 3, 2, '{lifestyle,mode,beaute}', '{casino,porn,pharma}', 'Contenu lifestyle de qualité', 'active', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'Lien Nofollow Article Lifestyle.ma', 'Lien nofollow dans un article lifestyle', 'lien-nofollow-article-lifestyle', '{https://example.com/link2.jpg}', '{nofollow,content,lifestyle}', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('0d3c2c67-2d94-4d1a-a59c-06e1860b951a', '7c9eabf0-4014-4257-af06-8f3a7d065798', 'Lien Sponsored Sidebar Business.ma', 'Lien sponsored dans la sidebar du portail business', 'https://example.com', 'Investissement Maroc', 'sponsored', 'sidebar', 2000.00, 'MAD', 12, 1, '{business,finance,investissement}', '{casino,porn,pharma}', 'Contenu business professionnel', 'active', '79842797-dcb4-402d-9e6e-92405d306d05', 'Lien Sponsored Sidebar Business.ma', 'Lien sponsored dans la sidebar', 'lien-sponsored-sidebar-business', '{https://example.com/link3.jpg}', '{sponsored,sidebar,business}', '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00'),
	('7ba24978-5788-44f4-9b31-86bdd69a86e3', '2696c870-2e66-4156-ae55-df592376babc', 'test', 'iugolg', 'https://toutamenager.ma/jardin-terrasse-au-maroc/', 'll', 'dofollow', 'content', 3000.00, 'MAD', 1, 1, '{}', '{}', '', 'active', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '', '', 'test', '{}', '{}', '2025-07-30 09:25:00.08257+00', '2025-07-30 09:25:00.08257+00'),
	('d3bc7dd6-2b5b-403b-80c4-e93763ca4d91', '78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'Lien Premium - Article Tech', 'Lien dofollow de haute qualité sur un article technologique', 'https://example.com/article-tech', 'technologie', 'dofollow', 'sidebar', 500.00, 'MAD', 1, NULL, '{tech,business}', NULL, NULL, 'active', '550e8400-e29b-41d4-a716-446655440002', NULL, NULL, 'lien-premium-article-tech', NULL, NULL, '2025-07-30 12:13:11.398084+00', '2025-07-30 12:13:11.398084+00'),
	('b49470a8-904c-49ae-a14e-de2051d630ef', '78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'Lien Sponsored - Guide Marketing', 'Lien sponsored sur un guide de marketing digital', 'https://example.com/guide-marketing', 'marketing digital', 'sponsored', 'content', 750.00, 'MAD', 1, NULL, '{marketing,business}', NULL, NULL, 'active', '550e8400-e29b-41d4-a716-446655440002', NULL, NULL, 'lien-sponsored-guide-marketing', NULL, NULL, '2025-07-30 12:13:11.398084+00', '2025-07-30 12:13:11.398084+00'),
	('95eb6a32-e93c-413f-9b9c-6e6ac7f5c7ad', '78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'Lien UGC - Avis Produit', 'Lien UGC sur un avis de produit', 'https://example.com/avis-produit', 'avis client', 'ugc', 'footer', 300.00, 'MAD', 1, NULL, '{lifestyle,shopping}', NULL, NULL, 'active', '550e8400-e29b-41d4-a716-446655440002', NULL, NULL, 'lien-ugc-avis-produit', NULL, NULL, '2025-07-30 12:13:11.398084+00', '2025-07-30 12:13:11.398084+00'),
	('68539c1e-d73a-4570-8f4d-409bc34c3ea9', '78f4ab47-a228-42fb-8cf9-d6a3459f1cd5', 'Lien Nofollow - Ressource', 'Lien nofollow sur une page de ressources', 'https://example.com/ressources', 'ressources', 'nofollow', 'header', 400.00, 'MAD', 1, NULL, '{education,reference}', NULL, NULL, 'active', '550e8400-e29b-41d4-a716-446655440002', NULL, NULL, 'lien-nofollow-ressource', NULL, NULL, '2025-07-30 12:13:11.398084+00', '2025-07-30 12:13:11.398084+00'),
	('2a6e7e75-34da-4b08-b9d4-2a64139bad80', '2696c870-2e66-4156-ae55-df592376babc', '35EGEGHEHE', 'GEHEHEHEH', 'https://toutamenager.ma/cuisine-moderne-au-maroc/', '', 'dofollow', 'content', 99.98, 'MAD', 1, 1, '{}', '{}', '', 'active', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '', '', '35egeghehe', '{}', '{}', '2025-07-31 19:26:31.335098+00', '2025-07-31 19:26:31.335098+00');


--
-- Data for Name: credit_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."credit_transactions" ("id", "user_id", "type", "amount", "currency", "status", "description", "related_transaction_id", "related_link_listing_id", "related_purchase_request_id", "payment_method", "payment_reference", "balance_before", "balance_after", "created_at", "completed_at") VALUES
	('2b8b8bd6-9eed-4e5e-bbd4-1e522ba137d0', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'deposit', 1000.00, 'MAD', 'completed', 'Rechargement de compte - bank_transfer', NULL, NULL, NULL, 'bank_transfer', NULL, 0.00, 1000.00, '2025-07-30 09:42:55.37+00', '2025-07-30 09:42:55.37+00'),
	('9f3a3a3b-391f-474d-9987-b565c4ca7455', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'deposit', 1200.00, 'MAD', 'completed', 'Rechargement de compte - bank_transfer', NULL, NULL, NULL, 'bank_transfer', NULL, 200.00, 1400.00, '2025-07-30 11:45:04.747+00', '2025-07-30 11:45:04.747+00'),
	('7d38be3a-19dd-44a0-9c37-ad45b24c4ce8', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'deposit', 800.00, 'MAD', 'completed', 'Rechargement de compte - bank_transfer', NULL, NULL, NULL, 'bank_transfer', NULL, 1400.00, 2200.00, '2025-07-30 12:00:48.507+00', '2025-07-30 12:00:48.507+00'),
	('169a8908-5abb-458b-b08c-d0291466c7d1', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 120.00, 'MAD', 'completed', 'Achat d''opportunité de lien virtuel: Business.ma (Nouveau)', NULL, NULL, NULL, 'manual', NULL, 2200.00, 2080.00, '2025-07-30 12:24:47.405+00', '2025-07-30 12:24:47.405+00'),
	('f31a8535-eb6f-48d3-bb0e-46cd99c19a49', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 80.00, 'MAD', 'completed', 'Achat d''opportunité de lien virtuel: Lifestyle.ma (Nouveau)', NULL, NULL, NULL, 'manual', NULL, 2080.00, 2000.00, '2025-07-31 19:22:27.653+00', '2025-07-31 19:22:27.653+00'),
	('7bac2278-83d8-4ba2-a5b0-1b6c16fbd583', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 500.00, 'MAD', 'completed', 'Achat d''opportunité de lien: Lien Premium - Article Tech', NULL, NULL, NULL, 'manual', NULL, 2000.00, 1500.00, '2025-07-31 19:23:18.187+00', '2025-07-31 19:23:18.187+00'),
	('4ca672e9-7c6c-4553-80c5-ce027efa6e96', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 800.00, 'MAD', 'completed', 'Achat d''opportunité de lien: Lien Nofollow Article Lifestyle.ma', NULL, NULL, NULL, 'manual', NULL, 1500.00, 700.00, '2025-07-31 19:36:16.262+00', '2025-07-31 19:36:16.262+00'),
	('512d727c-bad8-4322-8e4c-0942d55ae979', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 99.98, 'MAD', 'completed', 'Achat d''opportunité de lien: 35EGEGHEHE', NULL, NULL, NULL, 'manual', NULL, 700.00, 600.02, '2025-07-31 19:52:12.479+00', '2025-07-31 19:52:12.479+00'),
	('e8b4dc35-3d6b-48dc-9643-8e1feb6a713b', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 99.98, 'MAD', 'completed', 'Achat de lien: 35EGEGHEHE', NULL, NULL, NULL, 'manual', NULL, 600.02, 500.04, '2025-07-31 20:02:03.805+00', '2025-07-31 20:02:03.805+00'),
	('89561d7e-1ba1-48fd-a4b5-ca5dcc51f3c8', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 99.98, 'MAD', 'completed', 'Achat de lien: 35EGEGHEHE', NULL, NULL, NULL, 'manual', NULL, 500.04, 400.06, '2025-07-31 20:04:31.503+00', '2025-07-31 20:04:31.503+00'),
	('8b05732b-4310-4715-96ba-7dc371d7f072', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'deposit', 399.94, 'MAD', 'completed', 'Rechargement de compte - manual', NULL, NULL, NULL, 'manual', 'Rechargement automatique pour achat', 400.06, 800.00, '2025-07-31 20:10:26.897+00', '2025-07-31 20:10:26.897+00'),
	('cf291819-0341-45a5-93c2-dcfcf5183111', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 800.00, 'MAD', 'completed', 'Achat d''opportunité: Lien Nofollow Article Lifestyle.ma', NULL, NULL, NULL, 'manual', NULL, 800.00, 0.00, '2025-07-31 20:10:27.092+00', '2025-07-31 20:10:27.092+00'),
	('2804e179-999d-4559-942d-53a94198ff65', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'deposit', 2000.00, 'MAD', 'completed', 'Rechargement de compte - bank_transfer', NULL, NULL, NULL, 'bank_transfer', NULL, 0.00, 2000.00, '2025-07-31 20:11:21.04+00', '2025-07-31 20:11:21.04+00'),
	('35224c11-38e1-48f4-bf78-e81371ffebe4', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', 'purchase', 99.98, 'MAD', 'completed', 'Achat d''opportunité: 35EGEGHEHE', NULL, NULL, NULL, 'manual', NULL, 2000.00, 1900.02, '2025-07-31 20:12:37.227+00', '2025-07-31 20:12:37.227+00');


--
-- Data for Name: link_opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."link_opportunities" ("id", "campaign_id", "type", "site_name", "site_url", "site_metrics", "quality_type", "theme", "existing_article", "new_article", "price", "currency", "created_at", "updated_at") VALUES
	('35eb1aac-642b-421a-8fb2-fbed02306796', '6af37393-0386-4daa-b293-3ddaa770b64b', 'existing_article', 'TechBlog Pro', 'https://techblogpro.com', '{"cf": 72, "dr": 78, "ps": 89.5, "tf": 85, "age": 12, "outlinks": 25}', 'gold', 'Tech/Web Development', '{"age": 8, "url": "https://techblogpro.com/web-dev-guide", "title": "Guide complet du développement web moderne", "outlinks": 18}', NULL, 180.00, 'MAD', '2025-07-29 11:38:33.46086+00', '2025-07-29 11:38:33.46086+00'),
	('8ed60f1c-a147-45a8-b562-13ad420a19a8', '6af37393-0386-4daa-b293-3ddaa770b64b', 'new_article', 'Marketing Digital', 'https://marketingdigital.com', '{"cf": 58, "dr": 65, "ps": 87.2, "tf": 72, "focus": 85}', 'silver', 'Business/Marketing', NULL, '{"duration": "1 an", "placement_info": "Articles seront à 2 clics de la page d''accueil"}', 120.00, 'MAD', '2025-07-29 11:38:33.46086+00', '2025-07-29 11:38:33.46086+00');


--
-- Data for Name: link_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: link_purchase_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."link_purchase_requests" ("id", "link_listing_id", "user_id", "publisher_id", "target_url", "anchor_text", "message", "proposed_price", "proposed_duration", "status", "editor_response", "response_date", "created_at", "updated_at", "campaign_id") VALUES
	('774f8271-955c-43ab-91df-5a2768262716', 'dd7ab0d7-efdb-46ee-ac5f-f3a41b67dbf8', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'https://example.com/page1', 'lien exemple', 'Demande de test 1', 500.00, 3, 'pending', NULL, NULL, '2025-07-30 11:40:51.874179+00', '2025-07-30 11:40:51.874179+00', NULL),
	('1bcad904-c7d5-44cf-a2f2-ad7401173938', 'dd7ab0d7-efdb-46ee-ac5f-f3a41b67dbf8', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'https://example.com/page2', 'autre lien', 'Demande de test 2', 750.00, 6, 'accepted', NULL, NULL, '2025-07-30 11:40:51.874179+00', '2025-07-30 11:40:51.874179+00', NULL),
	('377c26ef-cd7c-463c-988e-993b80bb7cc4', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:41:25.065847+00', '2025-07-30 11:41:25.065847+00', NULL),
	('48674cee-0515-41d4-b058-153c5c0e593a', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:43:35.588879+00', '2025-07-30 11:43:35.588879+00', NULL),
	('b850cf12-f83d-4655-800a-e2309baf40aa', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:43:38.617614+00', '2025-07-30 11:43:38.617614+00', NULL),
	('0476bfd4-b75a-4433-9b74-dbf3ac80a3a6', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:46:57.221113+00', '2025-07-30 11:46:57.221113+00', NULL),
	('aa10743a-4f4c-48cf-b549-abb62bb1824d', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:49:31.97452+00', '2025-07-30 11:49:31.97452+00', NULL),
	('e8446d9a-3f01-43d4-a169-d305ca3a1abb', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:52:29.201237+00', '2025-07-30 11:52:29.201237+00', NULL),
	('0a22cb08-47d6-4cc7-b5bd-eee805a7ef06', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:54:30.007994+00', '2025-07-30 11:54:30.007994+00', NULL),
	('3d92a725-0a66-4c92-955c-034d9cc0a4f2', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:54:58.87083+00', '2025-07-30 11:54:58.87083+00', NULL),
	('caac818f-507c-4272-acf8-8f899f8e3bbc', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'https://ogince.ma/', 'ttrrurd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:57:37.721159+00', '2025-07-30 11:57:37.721159+00', NULL),
	('4f97d8f4-00bf-446e-9ec1-48b7fd8fbf40', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:58:25.417893+00', '2025-07-30 11:58:25.417893+00', NULL),
	('9fd9a4e7-a65d-4642-8d86-77255c472e9a', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 11:59:08.397654+00', '2025-07-30 11:59:08.397654+00', NULL),
	('fb76e18e-d7a2-4a17-a00c-5f3758c36e30', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:20.154192+00', '2025-07-30 12:00:20.154192+00', NULL),
	('bdb57abd-447a-4588-8e73-380d09723606', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:26.600823+00', '2025-07-30 12:00:26.600823+00', NULL),
	('2641b7fe-482d-4697-82fa-017fcc20213f', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:39.360623+00', '2025-07-30 12:00:39.360623+00', NULL),
	('281d8d94-4beb-40b6-8d23-3315fc6b7b58', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:53.051415+00', '2025-07-30 12:00:53.051415+00', NULL),
	('7ce3af0c-0035-4be6-ad46-bcc819e80ca5', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:55.706676+00', '2025-07-30 12:00:55.706676+00', NULL),
	('30abbc32-e830-48fc-bdc7-09edcbe16785', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:57.329772+00', '2025-07-30 12:00:57.329772+00', NULL),
	('5dc87193-762b-49b9-8def-5201235d36ff', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:00:58.475881+00', '2025-07-30 12:00:58.475881+00', NULL),
	('7f12a874-be59-46da-8d4e-81dd7922d7be', '75bd2336-6378-4d30-8f81-27611d7caa94', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', 'gdh', 'gdghd', NULL, 800.00, 1, 'pending', NULL, NULL, '2025-07-30 12:02:53.831958+00', '2025-07-30 12:02:53.831958+00', NULL),
	('48a02122-2371-4826-8da6-eb0559f55513', 'd3bc7dd6-2b5b-403b-80c4-e93763ca4d91', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '550e8400-e29b-41d4-a716-446655440002', 'kjbhbl', 'mknmi', NULL, 500.00, 1, 'pending', NULL, NULL, '2025-07-30 12:16:50.315163+00', '2025-07-30 12:16:50.315163+00', NULL),
	('f618aaea-c82f-4d4e-9b9e-66662d3aedfb', 'd3bc7dd6-2b5b-403b-80c4-e93763ca4d91', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '550e8400-e29b-41d4-a716-446655440002', 'tdrhr', 'ydjetyj', NULL, 500.00, 1, 'pending', NULL, NULL, '2025-07-30 12:25:29.069561+00', '2025-07-30 12:25:29.069561+00', NULL),
	('8ad29cc4-5df0-4616-a76a-e2fbe45f4465', 'd3bc7dd6-2b5b-403b-80c4-e93763ca4d91', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '550e8400-e29b-41d4-a716-446655440002', '', '', NULL, 500.00, 1, 'pending', NULL, NULL, '2025-07-30 12:25:33.583499+00', '2025-07-30 12:25:33.583499+00', NULL);


--
-- Data for Name: link_purchase_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."link_purchase_transactions" ("id", "purchase_request_id", "advertiser_id", "publisher_id", "link_listing_id", "amount", "currency", "platform_fee", "publisher_amount", "status", "payment_method", "payment_reference", "created_at", "completed_at", "metadata") VALUES
	('973e1055-42c3-4d46-b771-c505d6ae9dfb', '48674cee-0515-41d4-b058-153c5c0e593a', 'ac9257c4-5241-455a-a268-5fa3a36ee3a9', '40bc053e-4d22-45f8-8d25-177d3ab565e3', '75bd2336-6378-4d30-8f81-27611d7caa94', 800.00, 'MAD', 80.00, 720.00, 'completed', 'manual', NULL, '2025-07-30 11:43:35.987424+00', NULL, '{}');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."transactions" ("id", "purchase_request_id", "amount", "currency", "status", "payment_method", "advertiser_id", "publisher_id", "link_listing_id", "platform_fee", "publisher_amount", "created_at", "completed_at") VALUES
	('28e49af6-babc-40d9-b81b-e5bc17207b25', 'd1da9a6e-bf9c-4e6f-83fb-204fcd00eed4', 800.00, 'MAD', 'completed', 'virement', '54285e16-9188-480f-aced-29642a0e0ee0', '40bc053e-4d22-45f8-8d25-177d3ab565e3', '75bd2336-6378-4d30-8f81-27611d7caa94', 80.00, 720.00, '2025-07-26 22:49:43.873407+00', '2025-07-26 22:49:43.873407+00');


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: success_stories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: url_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."url_analyses" ("id", "url", "metrics", "category", "analysis_status", "created_at") VALUES
	('f0d00304-7903-41c5-973d-14a656f8db9c', 'https://example.com', '{"cf": 67, "dr": 45, "mc": 8000, "tf": 52, "traffic": 15000}', 'Computers/Internet/Web Design and Development', 'completed', '2025-07-29 11:38:33.46086+00'),
	('9754d7e7-ca77-4e3b-93d0-3ba88517fd30', 'https://example.com/products', '{"cf": 58, "dr": 42, "mc": 4000, "tf": 48, "traffic": 8000}', 'Shopping/Clothing and Accessories', 'completed', '2025-07-29 11:38:33.46086+00'),
	('a0014a86-8d8e-4275-9915-1104f6eabf5f', 'https://www.krosfou.fr/', '{"cf": 0, "dr": 91, "mc": 1645, "tf": 66, "traffic": 6708}', 'Business/Marketing and Advertising', 'completed', '2025-07-29 11:39:51.464+00'),
	('22bba0ad-8ce4-4960-9740-037efb613a96', 'https://www.krosfou.fr/', '{"cf": 70, "dr": 91, "mc": 2586, "tf": 11, "traffic": 8290}', 'Recreation/Travel', 'completed', '2025-07-30 20:20:49.006+00'),
	('b2e59f4f-f06c-4e52-8583-dc40c78b9c5a', 'https://www.krosfou.fr/', '{"cf": 16, "dr": 71, "mc": 2878, "tf": 44, "traffic": 4207}', 'Business/Marketing and Advertising', 'completed', '2025-07-30 20:27:54.885+00'),
	('f5b0bd8a-fc0e-43fa-a45a-ff28759937ec', 'https://www.krosfou.fr/', '{"cf": 6, "dr": 89, "mc": 1276, "tf": 66, "traffic": 5229}', 'Business/Marketing and Advertising', 'completed', '2025-07-31 18:47:04.35+00'),
	('6675d4f2-ad25-4714-a018-b352958ce602', 'https://www.krosfou.fr/', '{"cf": 86, "dr": 17, "mc": 925, "tf": 60, "traffic": 4967}', 'Computers/Internet/Web Design and Development', 'completed', '2025-08-02 08:00:35.244+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
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
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 29, true);


--
-- PostgreSQL database dump complete
--

RESET ALL;
