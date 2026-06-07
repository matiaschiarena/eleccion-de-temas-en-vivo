# Guía de Despliegue: Supabase & Vercel
## Tributo a Charly García - Live Request App

Este documento contiene las especificaciones técnicas, esquemas de bases de datos, datos de inserción rápidos y la guía de configuración para desplegar tu aplicación en **Vercel** usando **Supabase** como base de datos relacional.

---

## 1. Esquema de Base de Datos para Supabase (PostgreSQL)

Crea una base de datos nueva en Supabase y ejecuta el siguiente script en el **SQL Editor** para generar las tres tablas requeridas (`config`, `votes` y `songs`) con índices de alto rendimiento para soportar múltiples votos recurrentes por segundo en vivo.

```sql
-- =========================================================
-- 1. TABLA DE CONFIGURACIÓN DEL EVENTO
-- =========================================================
CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    evento_nombre VARCHAR(255) NOT NULL DEFAULT 'Las canciones más lindas de Charly',
    artistas VARCHAR(255) NOT NULL DEFAULT 'Marina Wil & Ian Shifres',
    lugar VARCHAR(255) NOT NULL DEFAULT 'La casa de Lolita',
    fecha VARCHAR(100) NOT NULL DEFAULT '05.06.2026',
    restriccion_activa BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = 1 Voto por persona (vía localStorage), FALSE = Modo Test
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar actualizaciones automáticas para config.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_config_modtime 
BEFORE UPDATE ON config 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insertar configuración inicial
INSERT INTO config (evento_nombre, artistas, lugar, fecha, restriccion_activa)
SELECT 'Las canciones más lindas de Charly', 'Marina Wil & Ian Shifres', 'La casa de Lolita', '05.06.2026', TRUE
WHERE NOT EXISTS (SELECT 1 FROM config LIMIT 1);


-- =========================================================
-- 2. TABLA DE CANCIONES (CATÁLOGO OFICIAL)
-- =========================================================
CREATE TABLE IF NOT EXISTS songs (
    id VARCHAR(255) PRIMARY KEY, -- ID seguro generado en base al tema
    banda VARCHAR(255) NOT NULL,
    anio INTEGER NOT NULL,
    disco VARCHAR(255) NOT NULL,
    tema VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas durante el show
CREATE INDEX IF NOT EXISTS idx_songs_search ON songs (tema, banda, disco);


-- =========================================================
-- 3. TABLA DE VOTOS EN VIVO
-- =========================================================
CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    song_id VARCHAR(255) REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de alto rendimiento para clasificar y contar votos rápidamente
CREATE INDEX IF NOT EXISTS idx_votes_song_id ON votes(song_id);
```

---

## 2. Inserción de Canciones (Seeding del Catálogo de Charly)

Ejecuta el siguiente script SQL en el SQL Editor de Supabase para popular la tabla `songs` con todas las más de 200 canciones del CSV oficial suministrado:

```sql
INSERT INTO songs (id, banda, anio, disco, tema) VALUES
('sui-generis-1972-vida-canci-n-para-mi-muerte', 'Sui Generis', 1972, 'Vida', 'Canción para mi muerte'),
('sui-generis-1972-vida-necesito', 'Sui Generis', 1972, 'Vida', 'Necesito'),
('sui-generis-1972-vida-dime-qui-n-me-lo-rob-', 'Sui Generis', 1972, 'Vida', 'Dime quién me lo robó'),
('sui-generis-1972-vida-estaci-n', 'Sui Generis', 1972, 'Vida', 'Estación'),
('sui-generis-1972-vida-toma-dos-blues', 'Sui Generis', 1972, 'Vida', 'Toma dos blues'),
('sui-generis-1972-vida-natalio-ruiz--el-hombrecito-del-sombrero-gris', 'Sui Generis', 1972, 'Vida', 'Natalio Ruiz, el hombrecito del sombrero gris'),
('sui-generis-1972-vida-mariel-y-el-capit-n', 'Sui Generis', 1972, 'Vida', 'Mariel y el capitán'),
('sui-generis-1972-vida-amigo--vuelve-a-casa-pronto', 'Sui Generis', 1972, 'Vida', 'Amigo, vuelve a casa pronto'),
('sui-generis-1972-vida-quiz-s-porque', 'Sui Generis', 1972, 'Vida', 'Quizás porque'),
('sui-generis-1972-vida-cuando-comenzamos-a-nacer', 'Sui Generis', 1972, 'Vida', 'Cuando comenzamos a nacer'),
('sui-generis-1972-vida-posludio', 'Sui Generis', 1972, 'Vida', 'Posludio'),
('sui-generis-1973-confesiones-de-invierno-cuando-ya-me-empiece-a-quedar-solo', 'Sui Generis', 1973, 'Confesiones de invierno', 'Cuando ya me empiece a quedar solo'),
('sui-generis-1973-confesiones-de-invierno-bienvenidos-al-tren', 'Sui Generis', 1973, 'Confesiones de invierno', 'Bienvenidos al tren'),
('sui-generis-1973-confesiones-de-invierno-un-hada--un-cisne', 'Sui Generis', 1973, 'Confesiones de invierno', 'Un hada, un cisne'),
('sui-generis-1973-confesiones-de-invierno-confesiones-de-invierno', 'Sui Generis', 1973, 'Confesiones de invierno', 'Confesiones de invierno'),
('sui-generis-1973-confesiones-de-invierno-rasgu-a-las-piedras', 'Sui Generis', 1973, 'Confesiones de invierno', 'Rasguña las piedras'),
('sui-generis-1973-confesiones-de-invierno-lunes-otra-vez', 'Sui Generis', 1973, 'Confesiones de invierno', 'Lunes otra vez'),
('sui-generis-1973-confesiones-de-invierno-aprendizaje', 'Sui Generis', 1973, 'Confesiones de invierno', 'Aprendizaje'),
('sui-generis-1973-confesiones-de-invierno-mr-jones--o-peque-a-semblanza-de-una-familia-tipo-americana', 'Sui Generis', 1973, 'Confesiones de invierno', 'Mr Jones, o pequeña semblanza de una familia tipo americana'),
('sui-generis-1973-confesiones-de-invierno-tribulaciones--lamentos-y-ocaso-of-a-tonto-rey-imaginario', 'Sui Generis', 1973, 'Confesiones de invierno', 'Tribulaciones, lamentos y ocaso de un tonto rey imaginario, o no'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-instituciones', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Instituciones'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-tango-en-segunda', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Tango en segunda'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-el-show-de-los-muertos', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'El show de los muertos'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-las-incre-bles-aventuras-del-sr--tijeras', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Las increíbles aventuras del Sr. Tijeras'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-peque-as-delicias-de-la-vida-conyugal', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Pequeñas delicias de la vida conyugal'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-el-tuerto-y-los-ciegos', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'El tuerto y los ciegos'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-m-sica-de-fondo-para-cualquier-fiesta', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Música de fondo para cualquier fiesta animada'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-para-qui-n-canto-yo-entonces', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Para quién canto yo entonces'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-juan-represi-n', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Juan Represión'),
('sui-generis-1974-peque-as-an-cdotas-sobre-las-instituciones-botas-locas', 'Sui Generis', 1974, 'Pequeñas anécdotas sobre las instituciones', 'Botas locas'),
('sui-generis-1974-adi-s-sui-generis-alto-en-la-torre', 'Sui Generis', 1974, 'Adiós Sui Generis', 'Alto en la torre'),
('sui-generis-1974-adi-s-sui-generis-entra', 'Sui Generis', 1974, 'Adiós Sui Generis', 'Entra'),
('sui-generis-1975-adi-s-sui-generis-la-fuga-del-paral-tico', 'Sui Generis', 1975, 'Adiós Sui Generis', 'La fuga del paralítico'),
('sui-generis-1975-adi-s-sui-generis-zapando-con-la-gente', 'Sui Generis', 1975, 'Adiós Sui Generis', 'Zapando con la gente'),
('sui-generis-1975-adi-s-sui-generis-blues-del-levante', 'Sui Generis', 1975, 'Adiós Sui Generis', 'Blues del levante'),
('sui-generis-1976-adi-s-sui-generis-eiti-leda', 'Sui Generis', 1976, 'Adiós Sui Generis', 'Eiti Leda'),
('porsuigieco-1976-porsuigieco-tu-alma-te-mira-hoy', 'Porsuigieco', 1976, 'Porsuigieco', 'Tu alma te mira hoy'),
('porsuigieco-1976-porsuigieco-quiero-ver--quiero-ser--quiero-entrar', 'Porsuigieco', 1976, 'Porsuigieco', 'Quiero ver, quiero ser, quiero entrar'),
('porsuigieco-1976-porsuigieco-antes-de-gira', 'Porsuigieco', 1976, 'Porsuigieco', 'Antes de gira'),
('porsuigieco-1976-porsuigieco-el-fantasma-de-canterville', 'Porsuigieco', 1976, 'Porsuigieco', 'El fantasma de Canterville'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-bubulina', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Bubulina'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-c-mo-mata-el-viento-norte', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Cómo mata el viento norte'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-boletos--pases-y-abonos', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Boletos, pases y abonos'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-no-puedo-verme-m-s', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'No puedo verme más'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-rock', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Rock'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-por-probar-el-vino-y-el-agua-salada', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Por probar el vino y el agua salada'),
('la-m-quina-de-hacer-p-jaros-1976-la-m-quina-de-hacer-p-jaros-ah--te-vi-entre-las-luces', 'La Máquina de Hacer Pájaros', 1976, 'La máquina de hacer pájaros', 'Ah, te vi entre las luces'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-marilyn--la-cenicienta-y-las-mujeres', 'La Máquina de Hacer Pájaros', 1977, 'Películas', 'Marilyn, la Cenicienta y las mujeres'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-no-te-dejes-desanimar', 'La Máquina de Hacer Pájaros', 1977, 'Películas', 'No te dejes desanimar'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-que-se-puede-hacer-salvo-ver-pel-culas', 'La Máquina de Hacer Pájaros', 1977, 'Películas', '¿Qué se puede hacer salvo ver películas?'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-hipercandombe', 'La Máquina de Hacer Pájaros', 1977, 'Películas', 'Hipercandombe'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-el-vendedor-de-las-chicas-de-pl-stico', 'La Máquina de Hacer Pájaros', 1977, 'Películas', 'El vendedor de las chicas de plástico'),
('la-m-quina-de-hacer-p-jaros-1977-pel-culas-ruta-perdedora', 'La Máquina de Hacer Pájaros', 1977, 'Películas', 'Ruta perdedora'),
('sui-generis-1975-adi-s-sui-generis-fabricante-de-mentiras', 'Sui Generis', 1975, 'Adiós Sui Generis', 'Fabricante de mentiras'),
('ser-giran-1978-ser-giran-el-mendigo-en-el-anden', 'Serú Girán', 1978, 'Serú Girán', 'El mendigo en el anden'),
('ser-giran-1978-ser-giran-separata', 'Serú Girán', 1978, 'Serú Girán', 'Separata'),
('ser-giran-1978-ser-giran-autos--jets--aviones--barcos', 'Serú Girán', 1978, 'Serú Girán', 'Autos, jets, aviones, barcos'),
('ser-giran-1978-ser-giran-ser-giran', 'Serú Girán', 1978, 'Serú Girán', 'Serú Girán'),
('ser-giran-1978-ser-giran-seminare', 'Serú Girán', 1978, 'Serú Girán', 'Seminare'),
('ser-giran-1978-ser-giran-voy-a-mil', 'Serú Girán', 1978, 'Serú Girán', 'Voy a mil'),
('billy-bond-and-the-jets-1979-billy-bond-and-the-jets-loco---no-te-sobra-una-moneda', 'Billy Bond and the Jets', 1979, 'Billy Bond and the Jets', 'Loco, ¿no te sobra una moneda?'),
('ser-giran-1979-la-grasa-de-las-capitales-la-grasa-de-las-capitales', 'Serú Girán', 1979, 'La grasa de las capitales', 'La grasa de las capitales'),
('ser-giran-1979-la-grasa-de-las-capitales-san-francisco-y-el-lobo', 'Serú Girán', 1979, 'La grasa de las capitales', 'San Francisco y el lobo'),
('ser-giran-1979-la-grasa-de-las-capitales-perro-andaluz', 'Serú Girán', 1979, 'La grasa de las capitales', 'Perro andaluz'),
('ser-giran-1979-la-grasa-de-las-capitales-frecuencia-modulada', 'Serú Girán', 1979, 'La grasa de las capitales', 'Frecuencia modulada'),
('ser-giran-1979-la-grasa-de-las-capitales-paranoia-y-soledad', 'Serú Girán', 1979, 'La grasa de las capitales', 'Paranoia y soledad'),
('ser-giran-1979-la-grasa-de-las-capitales-noche-de-perros', 'Serú Girán', 1979, 'La grasa de las capitales', 'Noche de perros'),
('ser-giran-1979-la-grasa-de-las-capitales-viernes-3-am', 'Serú Girán', 1979, 'La grasa de las capitales', 'Viernes 3 am'),
('ser-giran-1979-la-grasa-de-las-capitales-los-sobrevivientes', 'Serú Girán', 1979, 'La grasa de las capitales', 'Los sobrevivientes'),
('ser-giran-1979-la-grasa-de-las-capitales-canci-n-de-hollywood', 'Serú Girán', 1979, 'La grasa de las capitales', 'Canción de Hollywood'),
('ser-giran-1980-bicicleta-a-los-j-venes-de-ayer', 'Serú Girán', 1980, 'Bicicleta', 'A los jóvenes de ayer'),
('ser-giran-1980-bicicleta-cuanto-tiempo-mas-llevara', 'Serú Girán', 1980, 'Bicicleta', 'Cuanto tiempo mas llevara'),
('ser-giran-1980-bicicleta-canci-n-de-alicia-en-el-pa-s', 'Serú Girán', 1980, 'Bicicleta', 'Canción de Alicia en el país'),
('ser-giran-1980-bicicleta-mientras-miro-las-nuevas-olas', 'Serú Girán', 1980, 'Bicicleta', 'Mientras miro las nuevas olas'),
('ser-giran-1980-bicicleta-desarma-y-sangra', 'Serú Girán', 1980, 'Bicicleta', 'Desarma y sangra'),
('ser-giran-1980-bicicleta-encuentro-con-el-diablo', 'Serú Girán', 1980, 'Bicicleta', 'Encuentro con el diablo'),
('ser-giran-1981-peperina-peperina', 'Serú Girán', 1981, 'Peperina', 'Peperina'),
('ser-giran-1981-peperina-llorando-en-el-espejo', 'Serú Girán', 1981, 'Peperina', 'Llorando en el espejo'),
('ser-giran-1981-peperina-parado-en-el-medio-de-la-vida', 'Serú Girán', 1981, 'Peperina', 'Parado en el medio de la vida'),
('ser-giran-1981-peperina-esperando-nacer', 'Serú Girán', 1981, 'Peperina', 'Esperando nacer'),
('ser-giran-1981-peperina-cinema-verit-', 'Serú Girán', 1981, 'Peperina', 'Cinema verité'),
('ser-giran-1981-peperina-en-la-vereda-del-sol', 'Serú Girán', 1981, 'Peperina', 'En la vereda del sol'),
('ser-giran-1981-peperina-jos-mercado', 'Serú Girán', 1981, 'Peperina', 'José Mercado'),
('ser-giran-1981-peperina-salir-de-la-melancol-a', 'Serú Girán', 1981, 'Peperina', 'Salir de la melancolía'),
('sui-generis-2001-si-detr-s-de-las-paredes-afuera-de-la-ciudad', 'Sui Generis', 2001, 'Si - Detrás de las paredes', 'Afuera de la ciudad'),
('ser-giran-1982-no-llores-por-m--argentina-no-llores-por-m--argentina', 'Serú Girán', 1982, 'No llores por mí, Argentina', 'No llores por mí, Argentina'),
('solista-1982-yendo-de-la-cama-al-living-yendo-de-la-cama-al-living', 'Solista', 1982, 'Yendo de la cama al living', 'Yendo de la cama al living'),
('solista-1982-yendo-de-la-cama-al-living-superh-roes', 'Solista', 1982, 'Yendo de la cama al living', 'Superhéroes'),
('solista-1982-yendo-de-la-cama-al-living-no-bombardeen-buenos-aires', 'Solista', 1982, 'Yendo de la cama al living', 'No bombardeen Buenos Aires'),
('solista-1982-yendo-de-la-cama-al-living-vos-tambi-n-estabas-verde', 'Solista', 1982, 'Yendo de la cama al living', 'Vos también estabas verde'),
('solista-1982-yendo-de-la-cama-al-living-yo-no-quiero-volverme-tan-loco', 'Solista', 1982, 'Yendo de la cama al living', 'Yo no quiero volverme tan loco'),
('solista-1982-yendo-de-la-cama-al-living-canci-n-de-dos-por-tres', 'Solista', 1982, 'Yendo de la cama al living', 'Canción de dos por tres'),
('solista-1982-yendo-de-la-cama-al-living-peluca-telef-nica', 'Solista', 1982, 'Yendo de la cama al living', 'Peluca telefónica'),
('solista-1982-yendo-de-la-cama-al-living-inconsciente-colectivo', 'Solista', 1982, 'Yendo de la cama al living', 'Inconsciente Colectivo'),
('solista-1983-clics-modernos-nos-siguen-pegando-abajo--pecado-mortal-', 'Solista', 1983, 'Clics modernos', 'Nos siguen pegando abajo (Pecado mortal)'),
('solista-1983-clics-modernos-no-soy-un-extra-o', 'Solista', 1983, 'Clics modernos', 'No soy un extraño'),
('solista-1983-clics-modernos-dos-cero-uno--transas-', 'Solista', 1983, 'Clics modernos', 'Dos cero uno (Transas)'),
('solista-1983-clics-modernos-nuevos-trapos', 'Solista', 1983, 'Clics modernos', 'Nuevos trapos'),
('solista-1983-clics-modernos-bancate-ese-defecto', 'Solista', 1983, 'Clics modernos', 'Bancate ese defecto'),
('solista-1983-clics-modernos-no-me-dejan-salir', 'Solista', 1983, 'Clics modernos', 'No me dejan salir'),
('solista-1983-clics-modernos-los-dinosaurios', 'Solista', 1983, 'Clics modernos', 'Los dinosaurios'),
('solista-1983-clics-modernos-plateado-sobre-plateado--huellas-en-el-mar-', 'Solista', 1983, 'Clics modernos', 'Plateado sobre plateado (Huellas en el mar)'),
('solista-1983-clics-modernos-ojos-de-video-tape', 'Solista', 1983, 'Clics modernos', 'Ojos de video tape'),
('moro-satragni-1983-moro-satragni-como-me-gustar-a-ser-negro', 'Moro-Satragni', 1983, 'Moro-Satragni', 'Como me gustaría ser negro'),
('solista-1984-piano-bar-demoliendo-hoteles', 'Solista', 1984, 'Piano Bar', 'Demoliendo hoteles'),
('solista-1984-piano-bar-promesas-sobre-el-bidet', 'Solista', 1984, 'Piano Bar', 'Promesas sobre el bidet'),
('solista-1984-piano-bar-raros-peinados-nuevos', 'Solista', 1984, 'Piano Bar', 'Raros peinados nuevos'),
('solista-1984-piano-bar-piano-bar', 'Solista', 1984, 'Piano Bar', 'Piano bar'),
('solista-1984-piano-bar-no-te-anim-s-a-despegar', 'Solista', 1984, 'Piano Bar', 'No te animás a despegar'),
('solista-1984-piano-bar-no-se-va-a-llamar-mi-amor', 'Solista', 1984, 'Piano Bar', 'No se va a llamar mi amor'),
('solista-1984-piano-bar-tuve-tu-amor', 'Solista', 1984, 'Piano Bar', 'Tuve tu amor'),
('solista-1984-piano-bar-rap-del-exilio', 'Solista', 1984, 'Piano Bar', 'Rap del exilio'),
('solista-1984-piano-bar-cerca-de-la-revoluci-n', 'Solista', 1984, 'Piano Bar', 'Cerca de la revolución'),
('solista-1984-piano-bar-total-interferencia', 'Solista', 1984, 'Piano Bar', 'Total interferencia'),
('sui-generis-2001-si-detr-s-de-las-paredes-amo-lo-extra-o', 'Sui Generis', 2001, 'Si - Detrás de las paredes', 'Amo lo extraño'),
('solista-1998-el-aguante-tu-arma-en-el-sur', 'Solista', 1998, 'El Aguante', 'Tu arma en el sur'),
('solista-1987-parte-de-la-religi-n-rezo-por-vos', 'Solista', 1987, 'Parte de la religión', 'Rezo por vos'),
('solista-1986-tango-ngeles-y-predicadores', 'Solista', 1986, 'Tango', 'Ángeles y predicadores'),
('solista-1986-tango-pasajera-en-trance', 'Solista', 1986, 'Tango', 'Pasajera en trance'),
('solista-1986-tango-gramercy-park-hotel', 'Solista', 1986, 'Tango', 'Gramercy Park Hotel'),
('solista-1986-tango-culpable-eternamente', 'Solista', 1986, 'Tango', 'Culpable eternamente'),
('solista-1986-tango-la-gente-es-la-misma', 'Solista', 1986, 'Tango', 'La gente es la misma'),
('solista-1986-tango-hablando-a-tu-coraz-n', 'Solista', 1986, 'Tango', 'Hablando a tu corazón'),
('solista-1987-parte-de-la-religi-n-necesito-tu-amor', 'Solista', 1987, 'Parte de la religión', 'Necesito tu amor'),
('solista-1987-parte-de-la-religi-n-buscando-un-s-mbolo-de-paz', 'Solista', 1987, 'Parte de la religión', 'Buscando un símbolo de paz'),
('solista-1987-parte-de-la-religi-n-parte-de-la-religi-n', 'Solista', 1987, 'Parte de la religión', 'Parte de la religión'),
('solista-1987-parte-de-la-religi-n-rap-de-las-hormigas', 'Solista', 1987, 'Parte de la religión', 'Rap de las hormigas'),
('solista-1987-parte-de-la-religi-n-adela-en-el-carrousel', 'Solista', 1987, 'Parte de la religión', 'Adela en el carrousel'),
('solista-1987-parte-de-la-religi-n-no-voy-en-tren', 'Solista', 1987, 'Parte de la religión', 'No voy en tren'),
('solista-1987-parte-de-la-religi-n-el-karma-de-vivir-al-sur', 'Solista', 1987, 'Parte de la religión', 'El karma de vivir al sur'),
('solista-1987-parte-de-la-religi-n-ella-adivin-', 'Solista', 1987, 'Parte de la religión', 'Ella adivinó'),
('solista-1987-parte-de-la-religi-n-la-ruta-del-tentempi-', 'Solista', 1987, 'Parte de la religión', 'La ruta del tentempié'),
('solista-1988-c-mo-conseguir-chicas-no-toquen', 'Solista', 1988, 'Cómo conseguir chicas', 'No toquen'),
('solista-1988-c-mo-conseguir-chicas-zocacola', 'Solista', 1988, 'Cómo conseguir chicas', 'Zocacola'),
('solista-1988-c-mo-conseguir-chicas-fanky', 'Solista', 1988, 'Cómo conseguir chicas', 'Fanky'),
('solista-1988-c-mo-conseguir-chicas-no-me-ver-s-en-el-subte', 'Solista', 1988, 'Cómo conseguir chicas', 'No me verás en el subte'),
('solista-1988-c-mo-conseguir-chicas-ella-es-bailarina', 'Solista', 1988, 'Cómo conseguir chicas', 'Ella es bailarina'),
('solista-1988-c-mo-conseguir-chicas-anhedonia', 'Solista', 1988, 'Cómo conseguir chicas', 'Anhedonia'),
('solista-1988-c-mo-conseguir-chicas-suicida', 'Solista', 1988, 'Cómo conseguir chicas', 'Suicida'),
('solista-1988-c-mo-conseguir-chicas-fantasy', 'Solista', 1988, 'Cómo conseguir chicas', 'Fantasy'),
('solista-1988-c-mo-conseguir-chicas-a-punto-de-caer', 'Solista', 1988, 'Cómo conseguir chicas', 'A punto de caer'),
('solista-1988-c-mo-conseguir-chicas-shisyastawuman', 'Solista', 1988, 'Cómo conseguir chicas', 'Shisyastawuman'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-de-m-', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'De mí'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-filosof-a-barata-y-zapatos-de-goma', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Filosofía barata y zapatos de goma'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-reloj-de-plastilina', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Reloj de plastilina'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-gato-de-metal', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Gato de metal'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-no-te-mueras-en-mi-casa', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'No te mueras en mi casa'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-curitas', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Curitas'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-s-lo-un-poquito-no-m-s', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Sólo un poquito no más'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-siempre-puedes-olvidar', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Siempre puedes olvidar'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-la-canci-n-del-indeciso', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'La canción del indeciso'),
('solista-1991-tango-4-tu-amor', 'Solista', 1991, 'Tango 4', 'Tu amor'),
('solista-1991-tango-4-mientes', 'Solista', 1991, 'Tango 4', 'Mientes'),
('solista-1991-tango-4-vampiro', 'Solista', 1991, 'Tango 4', 'Vampiro'),
('solista-1991-tango-4-mala-se-al', 'Solista', 1991, 'Tango 4', 'Mala señal'),
('solista-1991-tango-4-30-denarios', 'Solista', 1991, 'Tango 4', '30 denarios'),
('solista-1991-tango-4-cucamonga-dance', 'Solista', 1991, 'Tango 4', 'Cucamonga dance'),
('solista-1991-tango-4-diana', 'Solista', 1991, 'Tango 4', 'Diana'),
('solista-1991-tango-4-happy-and-real', 'Solista', 1991, 'Tango 4', 'Happy and real'),
('solista-1992-tato-de-am-rica-es-esto-am-rica-', 'Solista', 1992, 'Tato de América', 'Es esto América?'),
('ser-giran-1992-ser-92-queen-elizabeth', 'Serú Girán', 1992, 'Serú ''92', 'Queen Elizabeth'),
('ser-giran-1992-ser-92-no-puedo-dejar', 'Serú Girán', 1992, 'Serú ''92', 'No puedo dejar'),
('ser-giran-1992-ser-92-hundiendo-el-titanic', 'Serú Girán', 1992, 'Serú ''92', 'Hundiendo el Titanic'),
('ser-giran-1992-ser-92-transformaci-n', 'Serú Girán', 1992, 'Serú ''92', 'Transformación'),
('ser-giran-1992-ser-92-nos-veremos-otra-vez', 'Serú Girán', 1992, 'Serú ''92', 'Nos veremos otra vez'),
('ser-giran-1992-ser-92-mu-vete-al-hablar', 'Serú Girán', 1992, 'Serú ''92', 'Muévete al hablar'),
('solista-1993-good-show-de-las-sombras-a-tu-coraz-n', 'Solista', 1993, 'Good Show', 'De las sombras a tu corazón'),
('solista-1994-la-hija-de-la-l-grima-overture', 'Solista', 1994, 'La hija de la lágrima', 'Overture'),
('solista-1994-la-hija-de-la-l-grima-v-ctima', 'Solista', 1994, 'La hija de la lágrima', 'Víctima'),
('solista-1994-la-hija-de-la-l-grima-jaco-y-chofi', 'Solista', 1994, 'La hija de la lágrima', 'Jaco y Chofi'),
('solista-1994-la-hija-de-la-l-grima-atlantis', 'Solista', 1994, 'La hija de la lágrima', 'Atlantis'),
('solista-1994-la-hija-de-la-l-grima-la-sal-no-sala', 'Solista', 1994, 'La hija de la lágrima', 'La sal no sala'),
('solista-1994-la-hija-de-la-l-grima-chipi-chipi', 'Solista', 1994, 'La hija de la lágrima', 'Chipi Chipi'),
('solista-1994-la-hija-de-la-l-grima-calle--taxi-', 'Solista', 1994, 'La hija de la lágrima', 'Calle (Taxi)'),
('solista-1994-la-hija-de-la-l-grima-love-is-love', 'Solista', 1994, 'La hija de la lágrima', 'Love is love'),
('solista-1994-la-hija-de-la-l-grima-tema-de-amor', 'Solista', 1994, 'La hija de la lágrima', 'Tema de amor'),
('solista-1994-la-hija-de-la-l-grima-fax-u', 'Solista', 1994, 'La hija de la lágrima', 'Fax U'),
('solista-1994-la-hija-de-la-l-grima-lament', 'Solista', 1994, 'La hija de la lágrima', 'Lament'),
('solista-1994-la-hija-de-la-l-grima-workin--in-the-morning', 'Solista', 1994, 'La hija de la lágrima', 'Workin'' in the morning'),
('solista-1994-la-hija-de-la-l-grima-waitin', 'Solista', 1994, 'La hija de la lágrima', 'Waitin'),
('solista-1994-la-hija-de-la-l-grima-kurosawa', 'Solista', 1994, 'La hija de la lágrima', 'Kurosawa'),
('solista-1994-la-hija-de-la-l-grima-chiquil-n', 'Solista', 1994, 'La hija de la lágrima', 'Chiquilín'),
('solista-1994-la-hija-de-la-l-grima-james-brown', 'Solista', 1994, 'La hija de la lágrima', 'James Brown'),
('solista-1994-la-hija-de-la-l-grima-intraterreno', 'Solista', 1994, 'La hija de la lágrima', 'Intraterreno'),
('solista-1994-la-hija-de-la-l-grima-no-sugar', 'Solista', 1994, 'La hija de la lágrima', 'No Sugar'),
('solista-1994-la-hija-de-la-l-grima-andan', 'Solista', 1994, 'La hija de la lágrima', 'Andan'),
('solista-1995-estaba-en-llamas-cuando-me-acost-te-recuerdo-invierno', 'Solista', 1995, 'Estaba en llamas cuando me acosté', 'Te recuerdo invierno'),
('solista-1996-say-no-more-estaba-en-llamas-cuando-me-acost-', 'Solista', 1996, 'Say no More', 'Estaba en llamas cuando me acosté'),
('solista-1996-say-no-more-vemos---', 'Solista', 1996, 'Say no More', 'Vemos...'),
('solista-1996-say-no-more-canciones-de-jirafas', 'Solista', 1996, 'Say no More', 'Canciones de jirafas'),
('solista-1996-say-no-more-necesito-un-gol', 'Solista', 1996, 'Say no More', 'Necesito un gol'),
('solista-1996-say-no-more-alguien-en-el-mundo-piensa-en-m-', 'Solista', 1996, 'Say no More', 'Alguien en el mundo piensa en mí'),
('solista-1996-say-no-more-constant-concept', 'Solista', 1996, 'Say no More', 'Constant Concept'),
('solista-1996-say-no-more-say-no-more', 'Solista', 1996, 'Say no More', 'Say no more'),
('solista-1996-say-no-more-cuchillos', 'Solista', 1996, 'Say no More', 'Cuchillos'),
('solista-1996-say-no-more-a1', 'Solista', 1996, 'Say no More', 'A1'),
('solista-1996-say-no-more-plan-9', 'Solista', 1996, 'Say no More', 'Plan 9'),
('solista-1996-say-no-more-casa-vac-a', 'Solista', 1996, 'Say no More', 'Casa vacía'),
('solista-1996-say-no-more-podr-as-entender', 'Solista', 1996, 'Say no More', 'Podrías entender'),
('solista-1996-say-no-more-intuici-n', 'Solista', 1996, 'Say no More', 'Intuición'),
('solista-1996-say-no-more-la-vanguardia-es-as-', 'Solista', 1996, 'Say no More', 'La vanguardia es así'),
('solista-1998-el-aguante-el-aguante', 'Solista', 1998, 'El Aguante', 'El aguante'),
('solista-1998-el-aguante-kill-my-mother', 'Solista', 1998, 'El Aguante', 'Kill my mother'),
('solista-1998-el-aguante-pedro-trabaja-en-el-cine', 'Solista', 1998, 'El Aguante', 'Pedro trabaja en el cine'),
('solista-1998-el-aguante-lo-que-ves-es-lo-que-hay--todo-el-mundo-quiere-olvidar-', 'Solista', 1998, 'El Aguante', 'Lo que ves es lo que hay (todo el mundo quiere olvidar)'),
('solista-1999-charly-charly-poseid-n', 'Solista', 1999, 'Charly & Charly', 'Poseidón'),
('sui-generis-2000-sinfon-as-para-adolescentes-el-d-a-que-apagaron-la-luz', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'El día que apagaron la luz'),
('sui-generis-2000-sinfon-as-para-adolescentes-afuera-de-la-ciudad', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Afuera de la ciudad'),
('sui-generis-2000-sinfon-as-para-adolescentes-no-es-el-fin', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'No es el fin'),
('sui-generis-2000-sinfon-as-para-adolescentes-intermedio', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Intermedio'),
('sui-generis-2000-sinfon-as-para-adolescentes-todos-van-a-news-caf-', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Todos van a News Café'),
('sui-generis-2000-sinfon-as-para-adolescentes-espejos', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Espejos'),
('sui-generis-2000-sinfon-as-para-adolescentes-monoblock', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Monoblock'),
('sui-generis-2000-sinfon-as-para-adolescentes-me-tir-por-vos', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Me tiré por vos'),
('sui-generis-2000-sinfon-as-para-adolescentes-noveno-b', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Noveno B'),
('sui-generis-2000-sinfon-as-para-adolescentes-digo-de-vos', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Digo de vos'),
('sui-generis-2001-si-detr-s-de-las-paredes-ya-no-te-quiero', 'Sui Generis', 2001, 'Si - Detrás de las paredes', 'Ya no te quiero'),
('sui-generis-2001-si-detr-s-de-las-paredes-telep-ticamente', 'Sui Generis', 2001, 'Si - Detrás de las paredes', 'Telepáticamente'),
('solista-2002-influencia-tu-vicio', 'Solista', 2002, 'Influencia', 'Tu vicio'),
('solista-2002-influencia-i-m-not-in-love', 'Solista', 2002, 'Influencia', 'I''m not in love'),
('solista-2002-influencia-el-amor-espera', 'Solista', 2002, 'Influencia', 'El amor espera'),
('solista-2002-influencia-pel-cula-sordomuda', 'Solista', 2002, 'Influencia', 'Película sordomuda'),
('solista-2003-rock-and-roll-yo-dileando-con-un-alma--que-no-puedo-entender-', 'Solista', 2003, 'Rock and Roll Yo', 'Dileando con un alma (que no puedo entender)'),
('solista-2003-rock-and-roll-yo-reh-n', 'Solista', 2003, 'Rock and Roll Yo', 'Rehén'),
('solista-2003-rock-and-roll-yo-ases-name', 'Solista', 2003, 'Rock and Roll Yo', 'Asesíname'),
('solista-2003-rock-and-roll-yo-v-s-d-', 'Solista', 2003, 'Rock and Roll Yo', 'V.S.D.'),
('solista-2003-rock-and-roll-yo-cretino', 'Solista', 2003, 'Rock and Roll Yo', 'Cretino'),
('solista-2003-rock-and-roll-yo-rock-and-roll-yo', 'Solista', 2003, 'Rock and Roll Yo', 'Rock and Roll Yo'),
('solista-2009-el-concierto-subacu-tico-deber-as-saber-por-qu-', 'Solista', 2009, 'El Concierto Subacuático', 'Deberías saber por qué'),
('solista-2010-kill-gil-no-importa', 'Solista', 2010, 'Kill Gil', 'No importa'),
('solista-2010-kill-gil-king-kong', 'Solista', 2010, 'Kill Gil', 'King Kong'),
('solista-2010-kill-gil-pastillas', 'Solista', 2010, 'Kill Gil', 'Pastillas'),
('solista-2010-kill-gil-los-fantasmas', 'Solista', 2010, 'Kill Gil', 'Los fantasmas'),
('solista-2010-kill-gil-coraz-n-de-hormig-n', 'Solista', 2010, 'Kill Gil', 'Corazón de hormigón'),
('solista-2010-kill-gil-break-it-up', 'Solista', 2010, 'Kill Gil', 'Break it up'),
('solista-2010-kill-gil-in-the-city-that-never-sleeps', 'Solista', 2010, 'Kill Gil', 'In the city that never sleeps'),
('solista-2017-random-la-m-quina-de-ser-feliz', 'Solista', 2017, 'Random', 'La máquina de ser feliz'),
('solista-2017-random-ella-es-tan-kubrick', 'Solista', 2017, 'Random', 'Ella es tan Kubrick'),
('solista-2017-random-primavera', 'Solista', 2017, 'Random', 'Primavera'),
('solista-2017-random-rivalidad', 'Solista', 2017, 'Random', 'Rivalidad'),
('solista-2017-random-otro', 'Solista', 2017, 'Random', 'Otro'),
('solista-2017-random-lluvia', 'Solista', 2017, 'Random', 'Lluvia'),
('solista-2017-random-believe', 'Solista', 2017, 'Random', 'Believe'),
('solista-2017-random-amigos-de-dios', 'Solista', 2017, 'Random', 'Amigos de Dios'),
('solista-2017-random-spector', 'Solista', 2017, 'Random', 'Spector'),
('solista-2017-random-mundo-b', 'Solista', 2017, 'Random', 'Mundo B'),
('solista-2024-la-l-gica-del-escorpi-n-yo-ya-s-', 'Solista', 2024, 'La lógica del escorpión', 'Yo ya sé'),
('solista-2024-la-l-gica-del-escorpi-n-el-club-de-los-27', 'Solista', 2024, 'La lógica del escorpión', 'El club de los 27'),
('solista-2024-la-l-gica-del-escorpi-n-la-medicina-n-9', 'Solista', 2024, 'La lógica del escorpión', 'La medicina n° 9'),
('solista-2024-la-l-gica-del-escorpi-n-autofemicidio', 'Solista', 2024, 'La lógica del escorpión', 'Autofemicidio'),
('solista-2024-la-l-gica-del-escorpi-n-estrellas-al-caer', 'Solista', 2024, 'La lógica del escorpión', 'Estrellas al caer'),
('solista-2024-la-l-gica-del-escorpi-n-la-l-gica-del-escorpi-n', 'Solista', 2024, 'La lógica del escorpión', 'La lógica del escorpión'),
('ser-giran-1982-no-llores-por-m--argentina-popotitos', 'Serú Girán', 1982, 'No llores por mí, Argentina', 'Popotitos'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-me-siento-mucho-mejor', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Me siento mucho mejor'),
('solista-1990-filosof-a-barata-y-zapatos-de-goma-himno-nacional-argentino', 'Solista', 1990, 'Filosofía barata y zapatos de goma', 'Himno Nacional Argentino'),
('solista-1991-tango-4-rompan-todo', 'Solista', 1991, 'Tango 4', 'Rompan todo'),
('solista-1991-tango-4-s-lo-dios-sabe', 'Solista', 1991, 'Tango 4', 'Sólo Dios sabe'),
('solista-1994-la-hija-de-la-l-grima-locomotion', 'Solista', 1994, 'La hija de la lágrima', 'Locomotion'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-there-s-a-place', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'There''s a place'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-you-keep-me-hangin-on', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'You keep me hangin'' on'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-positively-4th-street', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Positively 4th street'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-mellow-yellow', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Mellow Yellow'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-ticket-to-ride', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Ticket to ride'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-little-wing', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Little wing'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-build-me-up-buttercup', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Build me up buttercup'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-sweet-dreams', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Sweet dreams'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-sittin-on-the-dock-of-the-bay', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Sittin'' on the dock of the bay'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-fever', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Fever'),
('casandra-lange-1995-estaba-en-llamas-cuando-me-acost-sympathy-for-the-devil', 'Casandra Lange', 1995, 'Estaba en llamas cuando me acosté', 'Sympathy for the Devil'),
('solista-1998-el-aguante-no-estar-a-mal', 'Solista', 1998, 'El Aguante', 'No estaría mal'),
('solista-1998-el-aguante-soldado-de-lata', 'Solista', 1998, 'El Aguante', 'Soldado de lata'),
('solista-1998-el-aguante-correte-beethoven', 'Solista', 1998, 'El Aguante', 'Correte Beethoven'),
('solista-1998-el-aguante-dos-edificios-dorados', 'Solista', 1998, 'El Aguante', 'Dos edificios dorados'),
('solista-1998-el-aguante-uno-a-uno', 'Solista', 1998, 'El Aguante', 'Uno a uno'),
('solista-1999-demasiado-ego-sarabande', 'Solista', 1999, 'Demasiado ego', 'Sarabande'),
('solista-1999-demasiado-ego-sweet-home-buenos-aires', 'Solista', 1999, 'Demasiado ego', 'Sweet home Buenos Aires'),
('solista-1999-demasiado-ego-it-s-only-love', 'Solista', 1999, 'Demasiado ego', 'It''s only love'),
('solista-1999-charly-charly-el-chico-del-fin-de-semana', 'Solista', 1999, 'Charly & Charly', 'El chico del fin de semana'),
('solista-1999-charly-charly-el-peso', 'Solista', 1999, 'Charly & Charly', 'El peso'),
('solista-1999-charly-charly-con-su-blanca-palidez', 'Solista', 1999, 'Charly & Charly', 'Con su blanca palidez'),
('sui-generis-2000-sinfon-as-para-adolescentes-usame-un-poquito-m-s', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Usame un poquito más'),
('sui-generis-2000-sinfon-as-para-adolescentes-yo-soy-su-pap-', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Yo soy su papá'),
('sui-generis-2000-sinfon-as-para-adolescentes-tu-pueblo-tambi-n', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Tu pueblo también'),
('sui-generis-2000-sinfon-as-para-adolescentes-ten-pena', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Ten pena'),
('sui-generis-2000-sinfon-as-para-adolescentes-aqu-sin-tu-amor', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Aquí sin tu amor'),
('sui-generis-2000-sinfon-as-para-adolescentes-aguante-la-amistad', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Aguante la amistad'),
('sui-generis-2000-sinfon-as-para-adolescentes-el-chico-y-yo', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'El chico y yo'),
('sui-generis-2000-sinfon-as-para-adolescentes-s--mi-nena', 'Sui Generis', 2000, 'Sinfonías para adolescentes', 'Sé mi nena'),
('solista-2002-influencia-influencia', 'Solista', 2002, 'Influencia', 'Influencia'),
('solista-2002-influencia-mi-nena', 'Solista', 2002, 'Influencia', 'Mi nena'),
('solista-2003-rock-and-roll-yo-linda-bailarina', 'Solista', 2003, 'Rock and Roll Yo', 'Linda bailarina'),
('solista-2003-rock-and-roll-yo-wonder--love-s-in-need-of-love-today-', 'Solista', 2003, 'Rock and Roll Yo', 'Wonder (Love''s in need of love today)'),
('solista-2010-kill-gil-watching-the-wheels', 'Solista', 2010, 'Kill Gil', 'Watching the wheels'),
('solista-2024-la-l-gica-del-escorpi-n-am-rica', 'Solista', 2024, 'La lógica del escorpión', 'América'),
('solista-2024-la-l-gica-del-escorpi-n-la-pel-cana-y-el-androide', 'Solista', 2024, 'La lógica del escorpión', 'La pelícana y el androide'),
('solista-2024-la-l-gica-del-escorpi-n-rock-and-roll-star', 'Solista', 2024, 'La lógica del escorpión', 'Rock and Roll Star')
ON CONFLICT (id) DO NOTHING;
```

---

## 3. Variables de Entorno en Vercel

Cuando crees tu proyecto en el dashboard de **Vercel**, ve a la sección de **Settings > Environment Variables** y define las siguientes variables:

1. **`SUPABASE_URL`**: La URL de tu API REST de Supabase. La encuentras en *Project Settings > API > Project URL* (ej. `https://zxyasudfghjk.supabase.co`).
2. **`SUPABASE_ANON_KEY`**: La API Key pública anónima de Supabase. La encuentras en *Project Settings > API > Project API keys* (la que se marca como `anon` / `public`).
3. **`CONFIG_PASSWORD`**: Tu contraseña maestra para desbloquear el panel de configuración del Evento y alternar el "Modo Test" (ejemplo: `saynomore` u otra personalizada).
4. **`RESULTS_PASSWORD`**: Una contraseña diferente a la anterior para proteger el visualizador de estadísticas y ranking del show en vivo para el sonidista u organizadores (ejemplo: `charly` u otra de tu elección).
5. **`NODE_ENV`**: Configúralo como `production` para optimizar el bundle de React y la distribución estática de Express.

---

## 4. Guía de Despliegue Rápido en Vercel

1. **Sube tu código a GitHub / GitLab / Bitbucket**:
   Asegúrate de que tus archivos locales compilados estén limpios y tu repositorio cubra `package.json`, `vite.config.ts`, `server.ts`, `/server/`, y `/src/`.

2. **Crea el proyecto en Vercel**:
   - Haz clic en **Add New > Project** en Vercel.
   - Importa tu repositorio de GitHub.
   
3. **Parámetros de Build & Development**:
   - Vercel detectará que es un proyecto Vite, pero como es una aplicación **Full-Stack (Node/Express + React)**, usaremos la configuración automatizada.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist` (Vite compilará los estáticos ahí, y esbuild empaquetará el servidor en `dist/server.cjs`).
   - **Install Command**: `npm install`
   
4. **Pegar Variables de Entorno**:
   - Agrega las 4 variables de configuración listadas en la sección 3.

5. **¡Haz clic en Deploy!**:
   - Vercel construirá tus componentes y generará el enlace de hospedaje (`https://tu-proyecto.vercel.app`).

---

## 5. Notas de Funcionamiento Resiliente (Fallback)

Para garantizar un show en vivo sin interrupciones ni pantallas en blanco:
- **Resiliencia Automática**: Si las credenciales de Supabase no están configuradas o la base de datos se cae momentáneamente debido a mala señal telefónica en el lugar del concierto, el servidor **conmutará automáticamente al Modo Local**.
- **Base de Datos Local JSON**: En Modo Local, usará un archivo persistente estructurado llamado `database.json` autocreado en el propio sistema de archivos del servidor, garantizando que el show continúe y el público pueda seguir votando y visualizando el ranking en tiempo real sin perder datos en vivo.
