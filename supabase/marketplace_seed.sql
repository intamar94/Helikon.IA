-- ============================================================================
-- Marketplace de drones agrícolas — datos semilla
-- GENERADO AUTOMÁTICAMENTE por scripts/generar-sql-seed.ts — no editar a mano.
-- Fuente: lib/marketplace/seed-data.ts   ·   Regenerar: npm run marketplace:sql
-- Requiere supabase/marketplace_schema.sql aplicado previamente.
-- ============================================================================

begin;

-- 6 países: 2 activos, 2 en revisión, 2 mapeados.
insert into mkt_paises (id, nombre, codigo_iso, estado, fecha_activacion) values
  ('co', 'Colombia', 'CO', 'activo', '2026-02-10'),
  ('mx', 'México', 'MX', 'activo', '2026-04-01'),
  ('br', 'Brasil', 'BR', 'en_revision', null),
  ('ec', 'Ecuador', 'EC', 'en_revision', null),
  ('cr', 'Costa Rica', 'CR', 'mapeado', null),
  ('ar', 'Argentina', 'AR', 'mapeado', null)
on conflict (id) do update set
  nombre = excluded.nombre,
  codigo_iso = excluded.codigo_iso,
  estado = excluded.estado,
  fecha_activacion = excluded.fecha_activacion
;

-- Regiones. Mato Grosso está 'activo' aunque Brasil siga 'en_revision'.
insert into mkt_regiones (id, pais_id, nombre, estado) values
  ('co-antioquia', 'co', 'Antioquia', 'activo'),
  ('co-valle', 'co', 'Valle del Cauca', 'activo'),
  ('co-meta', 'co', 'Meta', 'activo'),
  ('co-tolima', 'co', 'Tolima', 'en_revision'),
  ('mx-sinaloa', 'mx', 'Sinaloa', 'activo'),
  ('mx-jalisco', 'mx', 'Jalisco', 'activo'),
  ('mx-michoacan', 'mx', 'Michoacán', 'en_revision'),
  ('mx-sonora', 'mx', 'Sonora', 'mapeado'),
  ('br-mato-grosso', 'br', 'Mato Grosso', 'activo'),
  ('br-sao-paulo', 'br', 'São Paulo', 'en_revision'),
  ('br-parana', 'br', 'Paraná', 'mapeado'),
  ('ec-guayas', 'ec', 'Guayas', 'en_revision'),
  ('ec-los-rios', 'ec', 'Los Ríos', 'mapeado'),
  ('cr-alajuela', 'cr', 'Alajuela', 'mapeado'),
  ('cr-limon', 'cr', 'Limón', 'mapeado'),
  ('ar-buenos-aires', 'ar', 'Buenos Aires', 'mapeado'),
  ('ar-cordoba', 'ar', 'Córdoba', 'mapeado')
on conflict (id) do update set
  pais_id = excluded.pais_id,
  nombre = excluded.nombre,
  estado = excluded.estado
;

-- Reglas de cumplimiento. Las de region_id no nulo pisan a la nacional.
insert into mkt_reglas_cumplimiento (id, pais_id, region_id, cultivo, servicio, certificacion_requerida, producto_permitido, verificada, verificada_por, fecha_verificacion, activa) values
  ('rg-co-banano-fumigacion', 'co', null, 'banano', 'fumigacion', 'Licencia ICA Aplicador Aéreo', 'Mancozeb 80% WP', true, 'normativa@helikon.ia', '2026-02-10', true),
  ('rg-co-valle-banano-fumigacion', 'co', 'co-valle', 'banano', 'fumigacion', 'Licencia ICA Aplicador Aéreo + Aval CVC', 'Azoxistrobina 25% SC (bajo impacto)', true, 'normativa@helikon.ia', '2026-05-18', true),
  ('rg-co-cafe-ndvi', 'co', null, 'cafe', 'mapeo_ndvi', 'Registro ICA Operador de Servicios', 'No aplica (sensado remoto)', true, 'normativa@helikon.ia', '2026-02-10', true),
  ('rg-co-meta-arroz-siembra', 'co', 'co-meta', 'arroz', 'siembra', 'Licencia ICA Aplicador Aéreo', 'Semilla certificada de arroz', false, null, null, true),
  ('rg-mx-maiz-fumigacion', 'mx', null, 'maiz', 'fumigacion', 'Licencia SENASICA Aplicador con RPAS', 'Clorantraniliprol 20% SC', true, 'normativa@helikon.ia', '2026-04-01', true),
  ('rg-mx-sinaloa-maiz-fumigacion', 'mx', 'mx-sinaloa', 'maiz', 'fumigacion', 'Licencia SENASICA Aplicador con RPAS + Aval Estatal Sinaloa', 'Bioinsecticida Bacillus thuringiensis', true, 'normativa@helikon.ia', '2026-06-02', true),
  ('rg-mx-maiz-dispersion', 'mx', null, 'maiz', 'dispersion_solidos', 'Licencia SENASICA Aplicador con RPAS', 'Urea granulada 46%', true, 'normativa@helikon.ia', '2026-04-01', true),
  ('rg-br-mt-soja-fumigacion', 'br', 'br-mato-grosso', 'soja', 'fumigacion', 'Certificado MAPA Aplicação Aérea (AEA)', 'Glifosato 48% SL', true, 'normativa@helikon.ia', '2026-07-15', true),
  ('rg-br-soja-fumigacion', 'br', null, 'soja', 'fumigacion', 'Certificado MAPA Aplicação Aérea (AEA)', 'Glifosato 48% SL', false, null, null, true),
  ('rg-ec-banano-fumigacion', 'ec', null, 'banano', 'fumigacion', 'Licencia Agrocalidad Aplicación Aérea', 'Propiconazol 25% EC', false, null, null, true)
on conflict (id) do update set
  pais_id = excluded.pais_id,
  region_id = excluded.region_id,
  cultivo = excluded.cultivo,
  servicio = excluded.servicio,
  certificacion_requerida = excluded.certificacion_requerida,
  producto_permitido = excluded.producto_permitido,
  verificada = excluded.verificada,
  verificada_por = excluded.verificada_por,
  fecha_verificacion = excluded.fecha_verificacion,
  activa = excluded.activa
;

insert into mkt_operadores (id, nombre, email, pais_base_id, verificado, rating, ubicacion_lat, ubicacion_lng) values
  ('op-aerocampo', 'AeroCampo Andino', 'ops@aerocampoandino.co', 'co', true, 4.8, 6.2442, -75.5812),
  ('op-dronagro-valle', 'DronAgro Valle', 'contacto@dronagrovalle.co', 'co', true, 4.6, 3.5394, -76.3036),
  ('op-fumiga-caribe', 'Fumiga Caribe', 'hola@fumigacaribe.co', 'co', true, 4.2, 10.9685, -74.7813),
  ('op-andes-drone', 'Andes Drone Services', 'info@andesdrone.co', 'co', false, 4.9, 4.711, -74.0721),
  ('op-agro-sinaloa', 'Agro Sinaloa Drones', 'vuelos@agrosinaloadrones.mx', 'mx', true, 4.7, 24.8091, -107.394),
  ('op-bajio-aereo', 'Bajío Aéreo', 'operaciones@bajioaereo.mx', 'mx', true, 4.4, 20.6597, -103.3496),
  ('op-cerrado-drones', 'Cerrado Drones', 'contato@cerradodrones.br', 'br', true, 4.5, -15.6014, -56.0979)
on conflict (id) do update set
  nombre = excluded.nombre,
  email = excluded.email,
  pais_base_id = excluded.pais_base_id,
  verificado = excluded.verificado,
  rating = excluded.rating,
  ubicacion_lat = excluded.ubicacion_lat,
  ubicacion_lng = excluded.ubicacion_lng
;

insert into mkt_certificaciones (id, titular_tipo, titular_id, pais_id, tipo_certificacion, numero, vigente_hasta, documento_url, documento_revisado) values
  ('cert-aerocampo-co', 'operador', 'op-aerocampo', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2024-0431', '2027-03-31', 'https://docs.helikon.ia/cert/ICA-AA-2024-0431.pdf', true),
  ('cert-aerocampo-co-ndvi', 'operador', 'op-aerocampo', 'co', 'Registro ICA Operador de Servicios', 'ICA-ROS-2024-1180', '2027-03-31', 'https://docs.helikon.ia/cert/ICA-ROS-2024-1180.pdf', true),
  ('cert-dronagro-co', 'operador', 'op-dronagro-valle', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2025-0902', '2027-06-30', 'https://docs.helikon.ia/cert/ICA-AA-2025-0902.pdf', true),
  ('cert-dronagro-co-cvc', 'operador', 'op-dronagro-valle', 'co', 'Licencia ICA Aplicador Aéreo + Aval CVC', 'CVC-AVAL-2026-0074', '2027-06-30', 'https://docs.helikon.ia/cert/CVC-AVAL-2026-0074.pdf', true),
  ('cert-fumiga-caribe-co', 'operador', 'op-fumiga-caribe', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2022-0155', '2026-01-31', 'https://docs.helikon.ia/cert/ICA-AA-2022-0155.pdf', true),
  ('cert-andes-co', 'operador', 'op-andes-drone', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2026-0011', '2028-01-31', 'https://docs.helikon.ia/cert/ICA-AA-2026-0011.pdf', false),
  ('cert-agro-sinaloa-mx', 'operador', 'op-agro-sinaloa', 'mx', 'Licencia SENASICA Aplicador con RPAS', 'SEN-RPAS-2025-2210', '2027-12-31', 'https://docs.helikon.ia/cert/SEN-RPAS-2025-2210.pdf', true),
  ('cert-agro-sinaloa-mx-estatal', 'operador', 'op-agro-sinaloa', 'mx', 'Licencia SENASICA Aplicador con RPAS + Aval Estatal Sinaloa', 'SIN-AVAL-2026-0033', '2027-12-31', 'https://docs.helikon.ia/cert/SIN-AVAL-2026-0033.pdf', true),
  ('cert-bajio-mx', 'operador', 'op-bajio-aereo', 'mx', 'Licencia SENASICA Aplicador con RPAS', 'SEN-RPAS-2024-1902', '2027-08-31', 'https://docs.helikon.ia/cert/SEN-RPAS-2024-1902.pdf', true),
  ('cert-cerrado-br', 'operador', 'op-cerrado-drones', 'br', 'Certificado MAPA Aplicação Aérea (AEA)', 'MAPA-AEA-2025-0781', '2027-11-30', 'https://docs.helikon.ia/cert/MAPA-AEA-2025-0781.pdf', true),
  ('cert-el-palmar-co', 'productor', 'pr-el-palmar', 'co', 'Licencia ICA Aplicador Aéreo + Aval CVC', 'CVC-AVAL-2026-0210', '2027-12-31', 'https://docs.helikon.ia/cert/CVC-AVAL-2026-0210.pdf', true),
  ('cert-san-miguel-mx', 'productor', 'pr-san-miguel', 'mx', 'Licencia SENASICA Aplicador con RPAS', 'SEN-RPAS-2026-7781', '2027-10-31', 'https://docs.helikon.ia/cert/SEN-RPAS-2026-7781.pdf', true)
on conflict (id) do update set
  titular_tipo = excluded.titular_tipo,
  titular_id = excluded.titular_id,
  pais_id = excluded.pais_id,
  tipo_certificacion = excluded.tipo_certificacion,
  numero = excluded.numero,
  vigente_hasta = excluded.vigente_hasta,
  documento_url = excluded.documento_url,
  documento_revisado = excluded.documento_revisado
;

insert into mkt_drones (id, operador_id, modelo, capacidad_carga_litros, hectareas_por_hora) values
  ('dr-aerocampo-t40', 'op-aerocampo', 'DJI Agras T40', 40, 16),
  ('dr-aerocampo-p4', 'op-aerocampo', 'DJI P4 Multispectral', 0, 55),
  ('dr-dronagro-t50', 'op-dronagro-valle', 'DJI Agras T50', 50, 21),
  ('dr-fumiga-t30', 'op-fumiga-caribe', 'DJI Agras T30', 30, 14),
  ('dr-andes-t40', 'op-andes-drone', 'DJI Agras T40', 40, 17),
  ('dr-sinaloa-t50', 'op-agro-sinaloa', 'XAG P100 Pro', 50, 19),
  ('dr-bajio-t40', 'op-bajio-aereo', 'DJI Agras T40', 40, 15),
  ('dr-cerrado-t50', 'op-cerrado-drones', 'DJI Agras T50', 50, 22)
on conflict (id) do update set
  operador_id = excluded.operador_id,
  modelo = excluded.modelo,
  capacidad_carga_litros = excluded.capacidad_carga_litros,
  hectareas_por_hora = excluded.hectareas_por_hora
;

-- Anuncios: un dron puede publicarse con piloto y en alquiler a la vez.
insert into mkt_anuncios (id, dron_id, modalidad, servicios_ofrecidos, precio_hectarea_usd, precio_dia_usd, horas_por_jornada, activo) values
  ('an-aerocampo-t40-piloto', 'dr-aerocampo-t40', 'con_piloto', array['fumigacion', 'dispersion_solidos']::mkt_servicio[], 11.5, null, 6, true),
  ('an-aerocampo-t40-alquiler', 'dr-aerocampo-t40', 'alquiler', array['fumigacion', 'dispersion_solidos']::mkt_servicio[], null, 420, 6, true),
  ('an-aerocampo-p4-piloto', 'dr-aerocampo-p4', 'con_piloto', array['mapeo_ndvi']::mkt_servicio[], 3.2, null, 6, true),
  ('an-aerocampo-p4-alquiler', 'dr-aerocampo-p4', 'alquiler', array['mapeo_ndvi']::mkt_servicio[], null, 180, 6, true),
  ('an-dronagro-t50-piloto', 'dr-dronagro-t50', 'con_piloto', array['fumigacion', 'dispersion_solidos', 'siembra']::mkt_servicio[], 12.9, null, 6, true),
  ('an-dronagro-t50-alquiler', 'dr-dronagro-t50', 'alquiler', array['fumigacion', 'siembra']::mkt_servicio[], null, 480, 6, true),
  ('an-fumiga-t30-piloto', 'dr-fumiga-t30', 'con_piloto', array['fumigacion']::mkt_servicio[], 10.4, null, 6, true),
  ('an-andes-t40-piloto', 'dr-andes-t40', 'con_piloto', array['fumigacion', 'mapeo_ndvi']::mkt_servicio[], 9.8, null, 6, true),
  ('an-sinaloa-t50-piloto', 'dr-sinaloa-t50', 'con_piloto', array['fumigacion', 'dispersion_solidos', 'siembra']::mkt_servicio[], 13.4, null, 6, true),
  ('an-sinaloa-t50-alquiler', 'dr-sinaloa-t50', 'alquiler', array['fumigacion', 'siembra']::mkt_servicio[], null, 520, 6, true),
  ('an-bajio-t40-piloto', 'dr-bajio-t40', 'con_piloto', array['fumigacion', 'mapeo_ndvi']::mkt_servicio[], 12.1, null, 6, true),
  ('an-cerrado-t50-piloto', 'dr-cerrado-t50', 'con_piloto', array['fumigacion', 'siembra']::mkt_servicio[], 10.9, null, 6, true),
  ('an-cerrado-t50-alquiler', 'dr-cerrado-t50', 'alquiler', array['fumigacion', 'siembra']::mkt_servicio[], null, 390, 6, true)
on conflict (id) do update set
  dron_id = excluded.dron_id,
  modalidad = excluded.modalidad,
  servicios_ofrecidos = excluded.servicios_ofrecidos,
  precio_hectarea_usd = excluded.precio_hectarea_usd,
  precio_dia_usd = excluded.precio_dia_usd,
  horas_por_jornada = excluded.horas_por_jornada,
  activo = excluded.activo
;

insert into mkt_productores (id, nombre, email, pais_id, region_id, ubicacion_lat, ubicacion_lng) values
  ('pr-la-esperanza', 'Finca La Esperanza', 'admin@fincalaesperanza.co', 'co', 'co-antioquia', 7.8828, -76.6256),
  ('pr-el-palmar', 'Hacienda El Palmar', 'gerencia@haciendaelpalmar.co', 'co', 'co-valle', 3.5, -76.3),
  ('pr-los-llanos', 'Agrícola Los Llanos', 'campo@agricolaloslllanos.co', 'co', 'co-meta', 4.142, -73.6266),
  ('pr-san-miguel', 'Rancho San Miguel', 'produccion@ranchosanmiguel.mx', 'mx', 'mx-sinaloa', 25, -107.5),
  ('pr-boa-vista', 'Fazenda Boa Vista', 'campo@fazendaboavista.br', 'br', 'br-mato-grosso', -13, -55.9),
  ('pr-don-ramiro', 'Estancia Don Ramiro', 'contacto@estanciadonramiro.ar', 'ar', 'ar-buenos-aires', -34.6037, -58.3816)
on conflict (id) do update set
  nombre = excluded.nombre,
  email = excluded.email,
  pais_id = excluded.pais_id,
  region_id = excluded.region_id,
  ubicacion_lat = excluded.ubicacion_lat,
  ubicacion_lng = excluded.ubicacion_lng
;

commit;
