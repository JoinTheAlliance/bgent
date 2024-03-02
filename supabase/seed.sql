INSERT INTO public.accounts (id, name, email, avatar_url, details, is_agent) VALUES ('00000000-0000-0000-0000-000000000000', 'Default Agent', 'default@agent.com', '', '{}', TRUE);
INSERT INTO public.rooms (id, created_by, name) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Default Agent Room');
INSERT INTO public.participants (user_id, room_id) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
