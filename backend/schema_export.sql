--
-- PostgreSQL database dump
--

\restrict xvMsNZA3iDkneGyLCP2S9DMbSFo3DCBK587h8RGb8Dlp1Q1XaBwDAFOCWYbkwhq

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: draws; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.draws (
    id integer NOT NULL,
    week_date date NOT NULL,
    time_slot character varying(20),
    player1_id integer,
    player2_id integer,
    player1_position integer,
    player2_position integer,
    bar_duty character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    reschedule_notes text,
    is_published boolean DEFAULT false,
    processed boolean DEFAULT false
);


ALTER TABLE public.draws OWNER TO eli;

--
-- Name: draws_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.draws_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.draws_id_seq OWNER TO eli;

--
-- Name: draws_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.draws_id_seq OWNED BY public.draws.id;


--
-- Name: ladder_history; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.ladder_history (
    id integer NOT NULL,
    user_id integer,
    week_date date NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ladder_history OWNER TO eli;

--
-- Name: ladder_history_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.ladder_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ladder_history_id_seq OWNER TO eli;

--
-- Name: ladder_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.ladder_history_id_seq OWNED BY public.ladder_history.id;


--
-- Name: ladder_positions; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.ladder_positions (
    id integer NOT NULL,
    user_id integer,
    "position" integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    updated_at timestamp without time zone DEFAULT now(),
    has_shield boolean DEFAULT false,
    resume_date date
);


ALTER TABLE public.ladder_positions OWNER TO eli;

--
-- Name: ladder_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.ladder_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ladder_positions_id_seq OWNER TO eli;

--
-- Name: ladder_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.ladder_positions_id_seq OWNED BY public.ladder_positions.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    week_date date NOT NULL,
    player_id integer,
    opponent_id integer,
    draw_id integer,
    games_won integer NOT NULL,
    games_lost integer NOT NULL,
    result character varying(10) NOT NULL,
    match_score character varying(50),
    submitted_at timestamp without time zone DEFAULT now(),
    admin_approved boolean DEFAULT false,
    set_scores jsonb
);


ALTER TABLE public.matches OWNER TO eli;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.matches_id_seq OWNER TO eli;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer,
    earliest_time character varying(20),
    notes text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_preferences OWNER TO eli;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_preferences_id_seq OWNER TO eli;

--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_member boolean DEFAULT false,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    is_junior boolean DEFAULT false,
    play_for_levels boolean DEFAULT false,
    phone_number character varying(20),
    squash_grade character varying(10),
    is_draw_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO eli;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: eli
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO eli;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eli
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: week_notes; Type: TABLE; Schema: public; Owner: eli
--

CREATE TABLE public.week_notes (
    id integer DEFAULT 1 NOT NULL,
    notes text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK ((id = 1))
);


ALTER TABLE public.week_notes OWNER TO eli;

--
-- Name: draws id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.draws ALTER COLUMN id SET DEFAULT nextval('public.draws_id_seq'::regclass);


--
-- Name: ladder_history id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_history ALTER COLUMN id SET DEFAULT nextval('public.ladder_history_id_seq'::regclass);


--
-- Name: ladder_positions id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_positions ALTER COLUMN id SET DEFAULT nextval('public.ladder_positions_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: draws draws_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.draws
    ADD CONSTRAINT draws_pkey PRIMARY KEY (id);


--
-- Name: ladder_history ladder_history_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_history
    ADD CONSTRAINT ladder_history_pkey PRIMARY KEY (id);


--
-- Name: ladder_history ladder_history_user_id_week_date_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_history
    ADD CONSTRAINT ladder_history_user_id_week_date_key UNIQUE (user_id, week_date);


--
-- Name: ladder_positions ladder_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_positions
    ADD CONSTRAINT ladder_positions_pkey PRIMARY KEY (id);


--
-- Name: ladder_positions ladder_positions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_positions
    ADD CONSTRAINT ladder_positions_user_id_key UNIQUE (user_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: week_notes week_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.week_notes
    ADD CONSTRAINT week_notes_pkey PRIMARY KEY (id);


--
-- Name: idx_draws_week; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_draws_week ON public.draws USING btree (week_date);


--
-- Name: idx_ladder_history_user; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_ladder_history_user ON public.ladder_history USING btree (user_id);


--
-- Name: idx_ladder_history_week; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_ladder_history_week ON public.ladder_history USING btree (week_date);


--
-- Name: idx_ladder_position; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_ladder_position ON public.ladder_positions USING btree ("position");


--
-- Name: idx_matches_approved; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_matches_approved ON public.matches USING btree (admin_approved);


--
-- Name: idx_matches_draw; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_matches_draw ON public.matches USING btree (draw_id);


--
-- Name: idx_matches_player; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_matches_player ON public.matches USING btree (player_id);


--
-- Name: idx_matches_week; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_matches_week ON public.matches USING btree (week_date);


--
-- Name: idx_user_preferences; Type: INDEX; Schema: public; Owner: eli
--

CREATE INDEX idx_user_preferences ON public.user_preferences USING btree (user_id);


--
-- Name: draws draws_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.draws
    ADD CONSTRAINT draws_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.users(id);


--
-- Name: draws draws_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.draws
    ADD CONSTRAINT draws_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.users(id);


--
-- Name: ladder_history ladder_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_history
    ADD CONSTRAINT ladder_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ladder_positions ladder_positions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.ladder_positions
    ADD CONSTRAINT ladder_positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: matches matches_draw_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_draw_id_fkey FOREIGN KEY (draw_id) REFERENCES public.draws(id);


--
-- Name: matches matches_opponent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_opponent_id_fkey FOREIGN KEY (opponent_id) REFERENCES public.users(id);


--
-- Name: matches matches_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eli
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xvMsNZA3iDkneGyLCP2S9DMbSFo3DCBK587h8RGb8Dlp1Q1XaBwDAFOCWYbkwhq

