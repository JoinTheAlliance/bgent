INSERT INTO public.accounts (id, name, email, register_complete, avatar_url, details) VALUES ('00000000-0000-0000-0000-000000000000', 'Default Agent', 'default@agent.com', true, '', '{}');

INSERT INTO public.rooms (id, created_by, name) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Default Agent Room');

INSERT INTO public.participants (user_id, room_id) VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');
