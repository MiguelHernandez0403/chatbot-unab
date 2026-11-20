--
-- PostgreSQL database dump
--

\restrict iz2oztQhz0Gbwh32RRZyioDt7FsX2lm9CtuWlbArciYmbqY23BR9WsXacw4sB46

-- Dumped from database version 16.16 (Debian 16.16-1.pgdg12+1)
-- Dumped by pg_dump version 16.16 (Debian 16.16-1.pgdg12+1)

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
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: match_documentos_unab(public.vector, integer, jsonb); Type: FUNCTION; Schema: public; Owner: unab_admin
--

CREATE FUNCTION public.match_documentos_unab(query_embedding public.vector, match_count integer DEFAULT 5, filter jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        documentos_unab.id,
        documentos_unab.content,
        documentos_unab.metadata,
        1 - (documentos_unab.embedding <=> query_embedding) AS similarity
    FROM documentos_unab
    WHERE metadata @> filter
    ORDER BY documentos_unab.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


ALTER FUNCTION public.match_documentos_unab(query_embedding public.vector, match_count integer, filter jsonb) OWNER TO unab_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cursos_malla; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.cursos_malla (
    codigo_curso character varying(20) NOT NULL,
    nombre_curso character varying(150) NOT NULL,
    creditos integer NOT NULL,
    semestre_sugerido integer NOT NULL,
    tipo_curso character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.cursos_malla OWNER TO unab_admin;

--
-- Name: documentos_unab; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.documentos_unab (
    id bigint NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    embedding public.vector(3072)
);


ALTER TABLE public.documentos_unab OWNER TO unab_admin;

--
-- Name: documentos_unab_id_seq; Type: SEQUENCE; Schema: public; Owner: unab_admin
--

CREATE SEQUENCE public.documentos_unab_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documentos_unab_id_seq OWNER TO unab_admin;

--
-- Name: documentos_unab_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: unab_admin
--

ALTER SEQUENCE public.documentos_unab_id_seq OWNED BY public.documentos_unab.id;


--
-- Name: estudiantes; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.estudiantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_banner character varying(20) NOT NULL,
    nombre_completo text NOT NULL,
    correo_institucional text NOT NULL,
    programa text DEFAULT 'Ingeniería de Sistemas'::text,
    semestre_actual integer,
    promedio_acumulado numeric(3,2),
    creditos_aprobados integer DEFAULT 0,
    estado_academico text DEFAULT 'Activo'::text,
    CONSTRAINT estudiantes_semestre_actual_check CHECK (((semestre_actual >= 1) AND (semestre_actual <= 10)))
);


ALTER TABLE public.estudiantes OWNER TO unab_admin;

--
-- Name: faq_academicas; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.faq_academicas (
    id integer NOT NULL,
    categoria character varying(50) NOT NULL,
    palabras_clave text NOT NULL,
    pregunta text NOT NULL,
    respuesta text NOT NULL,
    activa boolean DEFAULT true
);


ALTER TABLE public.faq_academicas OWNER TO unab_admin;

--
-- Name: faq_academicas_id_seq; Type: SEQUENCE; Schema: public; Owner: unab_admin
--

CREATE SEQUENCE public.faq_academicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faq_academicas_id_seq OWNER TO unab_admin;

--
-- Name: faq_academicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: unab_admin
--

ALTER SEQUENCE public.faq_academicas_id_seq OWNED BY public.faq_academicas.id;


--
-- Name: historial_academico; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.historial_academico (
    id integer NOT NULL,
    id_banner character varying(15),
    codigo_curso character varying(20),
    periodo character varying(10) NOT NULL,
    nota_final numeric(3,2),
    estado character varying(20) NOT NULL,
    CONSTRAINT historial_academico_estado_check CHECK (((estado)::text = ANY (ARRAY[('Aprobado'::character varying)::text, ('Cursando'::character varying)::text, ('Reprobado'::character varying)::text])))
);


ALTER TABLE public.historial_academico OWNER TO unab_admin;

--
-- Name: historial_academico_id_seq; Type: SEQUENCE; Schema: public; Owner: unab_admin
--

CREATE SEQUENCE public.historial_academico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_academico_id_seq OWNER TO unab_admin;

--
-- Name: historial_academico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: unab_admin
--

ALTER SEQUENCE public.historial_academico_id_seq OWNED BY public.historial_academico.id;


--
-- Name: matriculas_estudiantes; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.matriculas_estudiantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    estudiante_id uuid,
    oferta_id uuid,
    nota_corte1 numeric(3,2),
    nota_corte2 numeric(3,2),
    nota_corte3 numeric(3,2),
    nota_definitiva numeric(3,2),
    estado text DEFAULT 'Cursando'::text
);


ALTER TABLE public.matriculas_estudiantes OWNER TO unab_admin;

--
-- Name: n8n_chat_histories_unab; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.n8n_chat_histories_unab (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    message jsonb NOT NULL
);


ALTER TABLE public.n8n_chat_histories_unab OWNER TO unab_admin;

--
-- Name: n8n_chat_histories_unab_id_seq; Type: SEQUENCE; Schema: public; Owner: unab_admin
--

CREATE SEQUENCE public.n8n_chat_histories_unab_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.n8n_chat_histories_unab_id_seq OWNER TO unab_admin;

--
-- Name: n8n_chat_histories_unab_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: unab_admin
--

ALTER SEQUENCE public.n8n_chat_histories_unab_id_seq OWNED BY public.n8n_chat_histories_unab.id;


--
-- Name: oferta_academica; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.oferta_academica (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_materia character varying(20) NOT NULL,
    nombre_materia text NOT NULL,
    creditos integer NOT NULL,
    semestre_sugerido integer,
    grupo character varying(10) NOT NULL,
    horario text NOT NULL,
    salon text,
    profesor_id uuid,
    periodo character varying(10) DEFAULT '2026-2'::character varying
);


ALTER TABLE public.oferta_academica OWNER TO unab_admin;

--
-- Name: prerrequisitos; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.prerrequisitos (
    codigo_curso character varying(20) NOT NULL,
    codigo_prerrequisito character varying(20) NOT NULL
);


ALTER TABLE public.prerrequisitos OWNER TO unab_admin;

--
-- Name: profesores; Type: TABLE; Schema: public; Owner: unab_admin
--

CREATE TABLE public.profesores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_docente character varying(20) NOT NULL,
    nombre_completo text NOT NULL,
    correo_institucional text NOT NULL,
    departamento text DEFAULT 'Ingeniería de Sistemas'::text,
    area_especialidad text,
    horario_atencion text,
    oficina text,
    activo boolean DEFAULT true
);


ALTER TABLE public.profesores OWNER TO unab_admin;

--
-- Name: documentos_unab id; Type: DEFAULT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.documentos_unab ALTER COLUMN id SET DEFAULT nextval('public.documentos_unab_id_seq'::regclass);


--
-- Name: faq_academicas id; Type: DEFAULT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.faq_academicas ALTER COLUMN id SET DEFAULT nextval('public.faq_academicas_id_seq'::regclass);


--
-- Name: historial_academico id; Type: DEFAULT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.historial_academico ALTER COLUMN id SET DEFAULT nextval('public.historial_academico_id_seq'::regclass);


--
-- Name: n8n_chat_histories_unab id; Type: DEFAULT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.n8n_chat_histories_unab ALTER COLUMN id SET DEFAULT nextval('public.n8n_chat_histories_unab_id_seq'::regclass);


--
-- Name: cursos_malla cursos_malla_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.cursos_malla
    ADD CONSTRAINT cursos_malla_pkey PRIMARY KEY (codigo_curso);


--
-- Name: documentos_unab documentos_unab_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.documentos_unab
    ADD CONSTRAINT documentos_unab_pkey PRIMARY KEY (id);


--
-- Name: estudiantes estudiantes_correo_institucional_key; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_correo_institucional_key UNIQUE (correo_institucional);


--
-- Name: estudiantes estudiantes_id_banner_key; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_id_banner_key UNIQUE (id_banner);


--
-- Name: estudiantes estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.estudiantes
    ADD CONSTRAINT estudiantes_pkey PRIMARY KEY (id);


--
-- Name: faq_academicas faq_academicas_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.faq_academicas
    ADD CONSTRAINT faq_academicas_pkey PRIMARY KEY (id);


--
-- Name: historial_academico historial_academico_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.historial_academico
    ADD CONSTRAINT historial_academico_pkey PRIMARY KEY (id);


--
-- Name: matriculas_estudiantes matriculas_estudiantes_estudiante_id_oferta_id_key; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.matriculas_estudiantes
    ADD CONSTRAINT matriculas_estudiantes_estudiante_id_oferta_id_key UNIQUE (estudiante_id, oferta_id);


--
-- Name: matriculas_estudiantes matriculas_estudiantes_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.matriculas_estudiantes
    ADD CONSTRAINT matriculas_estudiantes_pkey PRIMARY KEY (id);


--
-- Name: n8n_chat_histories_unab n8n_chat_histories_unab_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.n8n_chat_histories_unab
    ADD CONSTRAINT n8n_chat_histories_unab_pkey PRIMARY KEY (id);


--
-- Name: oferta_academica oferta_academica_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.oferta_academica
    ADD CONSTRAINT oferta_academica_pkey PRIMARY KEY (id);


--
-- Name: prerrequisitos prerrequisitos_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.prerrequisitos
    ADD CONSTRAINT prerrequisitos_pkey PRIMARY KEY (codigo_curso, codigo_prerrequisito);


--
-- Name: profesores profesores_codigo_docente_key; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_codigo_docente_key UNIQUE (codigo_docente);


--
-- Name: profesores profesores_correo_institucional_key; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_correo_institucional_key UNIQUE (correo_institucional);


--
-- Name: profesores profesores_pkey; Type: CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_pkey PRIMARY KEY (id);


--
-- Name: idx_documentos_unab_metadata; Type: INDEX; Schema: public; Owner: unab_admin
--

CREATE INDEX idx_documentos_unab_metadata ON public.documentos_unab USING gin (metadata);


--
-- Name: historial_academico historial_academico_codigo_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.historial_academico
    ADD CONSTRAINT historial_academico_codigo_curso_fkey FOREIGN KEY (codigo_curso) REFERENCES public.cursos_malla(codigo_curso);


--
-- Name: matriculas_estudiantes matriculas_estudiantes_estudiante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.matriculas_estudiantes
    ADD CONSTRAINT matriculas_estudiantes_estudiante_id_fkey FOREIGN KEY (estudiante_id) REFERENCES public.estudiantes(id) ON DELETE CASCADE;


--
-- Name: matriculas_estudiantes matriculas_estudiantes_oferta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.matriculas_estudiantes
    ADD CONSTRAINT matriculas_estudiantes_oferta_id_fkey FOREIGN KEY (oferta_id) REFERENCES public.oferta_academica(id) ON DELETE CASCADE;


--
-- Name: oferta_academica oferta_academica_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.oferta_academica
    ADD CONSTRAINT oferta_academica_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.profesores(id) ON DELETE SET NULL;


--
-- Name: prerrequisitos prerrequisitos_codigo_curso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.prerrequisitos
    ADD CONSTRAINT prerrequisitos_codigo_curso_fkey FOREIGN KEY (codigo_curso) REFERENCES public.cursos_malla(codigo_curso) ON DELETE CASCADE;


--
-- Name: prerrequisitos prerrequisitos_codigo_prerrequisito_fkey; Type: FK CONSTRAINT; Schema: public; Owner: unab_admin
--

ALTER TABLE ONLY public.prerrequisitos
    ADD CONSTRAINT prerrequisitos_codigo_prerrequisito_fkey FOREIGN KEY (codigo_prerrequisito) REFERENCES public.cursos_malla(codigo_curso) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict iz2oztQhz0Gbwh32RRZyioDt7FsX2lm9CtuWlbArciYmbqY23BR9WsXacw4sB46

