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

insert into mkt_certificaciones_operador (id, operador_id, pais_id, tipo_certificacion, numero, vigente_hasta, documento_url, documento_revisado) values
  ('cert-aerocampo-co', 'op-aerocampo', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2024-0431', '2027-03-31', 'https://docs.helikon.ia/cert/ICA-AA-2024-0431.pdf', true),
  ('cert-aerocampo-co-ndvi', 'op-aerocampo', 'co', 'Registro ICA Operador de Servicios', 'ICA-ROS-2024-1180', '2027-03-31', 'https://docs.helikon.ia/cert/ICA-ROS-2024-1180.pdf', true),
  ('cert-dronagro-co', 'op-dronagro-valle', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2025-0902', '2027-06-30', 'https://docs.helikon.ia/cert/ICA-AA-2025-0902.pdf', true),
  ('cert-dronagro-co-cvc', 'op-dronagro-valle', 'co', 'Licencia ICA Aplicador Aéreo + Aval CVC', 'CVC-AVAL-2026-0074', '2027-06-30', 'https://docs.helikon.ia/cert/CVC-AVAL-2026-0074.pdf', true),
  ('cert-fumiga-caribe-co', 'op-fumiga-caribe', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2022-0155', '2026-01-31', 'https://docs.helikon.ia/cert/ICA-AA-2022-0155.pdf', true),
  ('cert-andes-co', 'op-andes-drone', 'co', 'Licencia ICA Aplicador Aéreo', 'ICA-AA-2026-0011', '2028-01-31', 'https://docs.helikon.ia/cert/ICA-AA-2026-0011.pdf', false),
  ('cert-agro-sinaloa-mx', 'op-agro-sinaloa', 'mx', 'Licencia SENASICA Aplicador con RPAS', 'SEN-RPAS-2025-2210', '2027-12-31', 'https://docs.helikon.ia/cert/SEN-RPAS-2025-2210.pdf', true),
  ('cert-agro-sinaloa-mx-estatal', 'op-agro-sinaloa', 'mx', 'Licencia SENASICA Aplicador con RPAS + Aval Estatal Sinaloa', 'SIN-AVAL-2026-0033', '2027-12-31', 'https://docs.helikon.ia/cert/SIN-AVAL-2026-0033.pdf', true),
  ('cert-bajio-mx', 'op-bajio-aereo', 'mx', 'Licencia SENASICA Aplicador con RPAS', 'SEN-RPAS-2024-1902', '2027-08-31', 'https://docs.helikon.ia/cert/SEN-RPAS-2024-1902.pdf', true),
  ('cert-cerrado-br', 'op-cerrado-drones', 'br', 'Certificado MAPA Aplicação Aérea (AEA)', 'MAPA-AEA-2025-0781', '2027-11-30', 'https://docs.helikon.ia/cert/MAPA-AEA-2025-0781.pdf', true)
on conflict (id) do update set
  operador_id = excluded.operador_id,
  pais_id = excluded.pais_id,
  tipo_certificacion = excluded.tipo_certificacion,
  numero = excluded.numero,
  vigente_hasta = excluded.vigente_hasta,
  documento_url = excluded.documento_url,
  documento_revisado = excluded.documento_revisado
;

insert into mkt_drones (id, operador_id, modelo, capacidad_carga_litros, servicios_ofrecidos, hectareas_por_hora, precio_base_hectarea_usd) values
  ('dr-aerocampo-t40', 'op-aerocampo', 'DJI Agras T40', 40, array['fumigacion', 'dispersion_solidos']::mkt_servicio[], 16, 11.5),
  ('dr-aerocampo-p4', 'op-aerocampo', 'DJI P4 Multispectral', 0, array['mapeo_ndvi']::mkt_servicio[], 55, 3.2),
  ('dr-dronagro-t50', 'op-dronagro-valle', 'DJI Agras T50', 50, array['fumigacion', 'dispersion_solidos', 'siembra']::mkt_servicio[], 21, 12.9),
  ('dr-fumiga-t30', 'op-fumiga-caribe', 'DJI Agras T30', 30, array['fumigacion']::mkt_servicio[], 14, 10.4),
  ('dr-andes-t40', 'op-andes-drone', 'DJI Agras T40', 40, array['fumigacion', 'mapeo_ndvi']::mkt_servicio[], 17, 9.8),
  ('dr-sinaloa-t50', 'op-agro-sinaloa', 'XAG P100 Pro', 50, array['fumigacion', 'dispersion_solidos', 'siembra']::mkt_servicio[], 19, 13.4),
  ('dr-bajio-t40', 'op-bajio-aereo', 'DJI Agras T40', 40, array['fumigacion', 'mapeo_ndvi']::mkt_servicio[], 15, 12.1),
  ('dr-cerrado-t50', 'op-cerrado-drones', 'DJI Agras T50', 50, array['fumigacion', 'siembra']::mkt_servicio[], 22, 10.9)
on conflict (id) do update set
  operador_id = excluded.operador_id,
  modelo = excluded.modelo,
  capacidad_carga_litros = excluded.capacidad_carga_litros,
  servicios_ofrecidos = excluded.servicios_ofrecidos,
  hectareas_por_hora = excluded.hectareas_por_hora,
  precio_base_hectarea_usd = excluded.precio_base_hectarea_usd
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
