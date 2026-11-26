# Fase 1 · Diagrama de relaciones (modelo resultante)

Negro = ya existe. **Negrita en la descripción = columna o tabla nueva de la Fase 1.**
Las tablas `crm_*` de catálogo (etapas, canales, motivos, tipos de tarea) y las de finanzas no se dibujan.

```mermaid
erDiagram
  vehiculos ||--o{ products : "vehiculo_id"
  part_catalog ||--o{ products : "catalog_id"
  products ||--o{ publicaciones : "product_id"
  products ||--o{ order_items : "product_id"
  products ||--o{ crm_quotation_items : "product_id"
  products o|--o{ crm_conversations : "product_id (repuesto ofrecido)"
  customers ||--o{ crm_customer_identities : "customer_id"
  customers ||--o{ crm_conversations : "customer_id"
  customers ||--o{ orders : "customer_id"
  crm_conversations ||--o{ crm_messages : "conversation_id"
  crm_conversations ||--o{ crm_follow_up_tasks : "conversation_id"
  crm_conversations ||--o{ crm_quotations : "conversation_id"
  crm_conversations ||--o{ crm_ai_suggestions : "conversation_id"
  crm_conversations o|--o{ orders : "crm_conversation_id"
  crm_conversations o|--o{ products : "reservado_para"
  crm_quotations ||--o{ crm_quotation_items : "quotation_id"
  crm_quotations o|--o| orders : "converted_order_id"
  orders ||--o{ order_items : "order_id"
  orders ||--o{ crm_payments : "order_id"
  red_solicitudes o|--o{ crm_conversations : "red_solicitud_id"
  oportunidades o|--o| vehiculos : "vehiculo_id (si se compra)"
  agente_tareas }o--o| crm_conversations : "entidad_id (polimórfico)"
  agente_tareas }o--o| products : "entidad_id (polimórfico)"
  agente_tareas }o--o| publicaciones : "entidad_id (polimórfico)"
  crm_outbox }o--|| agente_tareas : "se encola al aprobar (fase 3)"

  vehiculos {
    bigint id PK
    text codigo
    text marca
    text modelo
    text motor
    int anio_desde
    int anio_hasta
    bool en_desarme "lo usa el sitio; se sincroniza"
    date fecha_ingreso
    text patente "NUEVO"
    text vin "NUEVO"
    text ubicacion "NUEVO matriz|patio"
    text estado "NUEVO ingresado|en_desarme|desarmado|vendido_entero"
    numeric costo_compra "NUEVO"
    date fecha_compra "NUEVO"
  }
  products {
    bigint id PK
    text sku UK
    text name
    text oem_number "= numero de parte"
    text category
    jsonb vehicle_compatibility
    numeric price_cost
    numeric price_sale "= precio final"
    int stock
    text part_status "en_vehiculo|desmontada|reservada(NUEVO)|vendida|no_disponible"
    bool is_active
    jsonb images
    text lado
    text meli_item_id
    numeric precio_sugerido "NUEVO"
    text precio_estado "NUEVO pendiente|fijado"
    timestamptz precio_fijado_at "NUEVO"
    text ubicacion_fisica "NUEVO"
    text condicion "NUEVO"
    text imagen_promocional_url "NUEVO regla 1"
    uuid reservado_para "NUEVO"
    timestamptz reservado_hasta "NUEVO"
  }
  part_catalog {
    int id PK
    text sistema
    text pieza
    text como_busca
    jsonb solo_si
    jsonb no_si
    bool por_lado
    numeric precio_sugerido
  }
  customers {
    bigint id PK
    text first_name
    text last_name
    text phone_e164
    text comuna
    text region
    text source_channel FK
    text classification
    bool is_test
    text pais "NUEVO"
  }
  crm_customer_identities {
    bigint id PK
    bigint customer_id FK
    text channel_code
    text external_id "tel, psid, user ML"
  }
  crm_conversations {
    uuid id PK
    bigint customer_id FK
    text channel_code
    text contact_name
    text contact_phone
    text chat_status
    text sales_stage "21 etapas"
    text priority
    text loss_reason
    text next_action_type
    timestamptz next_action_at
    numeric potential_value
    text pieza_buscada "NUEVO"
    text vehiculo_buscado "NUEVO"
    bigint product_id "NUEVO"
    bigint red_solicitud_id "NUEVO"
  }
  crm_messages {
    uuid id PK
    uuid conversation_id FK
    text direction
    text sender_type "cliente|vendedor|ia|sistema"
    text body
    jsonb media
  }
  crm_quotations {
    uuid id PK
    text number
    uuid conversation_id FK
    text status "borrador..enviada..aceptada..convertida"
    date valid_until
    numeric total
    bigint converted_order_id
  }
  crm_quotation_items {
    bigint id PK
    uuid quotation_id FK
    bigint product_id FK
    text oem_code
    text condition
    numeric unit_price
    text warranty
  }
  crm_follow_up_tasks {
    uuid id PK
    uuid conversation_id FK
    text task_type
    timestamptz due_at
    text status
  }
  crm_ai_suggestions {
    uuid id PK
    uuid conversation_id FK
    text suggestion_type
    text content
    text status "propuesta|aprobada|editada|rechazada|enviada"
    uuid decided_by
  }
  orders {
    bigint id PK
    bigint customer_id FK
    uuid crm_conversation_id FK
    text status
    text source
    numeric total
    text payment_method "webpay|mercadopago"
    text delivery_method "pickup|home_delivery"
    text carrier "NUEVO starken|dhl|..."
    text tracking_number "NUEVO"
    timestamptz shipped_at "NUEVO"
  }
  order_items {
    bigint id PK
    bigint order_id FK
    bigint product_id FK
    int quantity
    numeric unit_price
    numeric total_price
  }
  crm_payments {
    uuid id PK
    bigint order_id FK
    numeric amount
    text method
    text status
    text proof_url
  }
  oportunidades {
    bigint id PK
    text fuente
    text fuente_id
    text titulo
    numeric precio_clp
    numeric score_ia
    text analisis_ia
    text estado "nueva|notificada"
    text decision "NUEVO pendiente|contactar|en_negociacion|comprada|descartada"
    timestamptz decidida_at "NUEVO"
    bigint vehiculo_id "NUEVO"
  }
  publicaciones {
    bigint id PK "TABLA NUEVA"
    bigint product_id FK
    text canal "web|marketplace|grupo_facebook|muro_facebook|instagram|mercadolibre|tiktok"
    text grupo_nombre
    text titulo
    text texto
    text imagen_url
    text url
    text external_id
    text estado "borrador|pendiente_aprobacion|aprobada|publicada|despublicar|despublicada|error"
    text creada_por
    uuid aprobada_por
  }
  red_solicitudes {
    bigint id PK "TABLA NUEVA"
    text id_red UK "#ID"
    text texto_original
    text comuna
    text marca
    text modelo
    int anio
    text pieza
    text estado "nueva|con_stock|sin_stock|respuesta_propuesta|respondida|descartada"
    bigint[] products_match
    text respuesta_propuesta
    uuid conversation_id FK
  }
  agente_tareas {
    bigint id PK "TABLA NUEVA"
    text agente "recepcionista|cotizador|seguimiento|..."
    text accion
    text entidad_tipo
    text entidad_id
    jsonb entrada
    jsonb salida
    text resultado "ok|error|omitida"
    bool requiere_aprobacion
    text estado_aprobacion "pendiente|aprobada|editada|rechazada|ejecutada|expirada"
    text propuesta "texto legible para aprobar desde el celular"
    uuid aprobado_por
    timestamptz decidido_at
    timestamptz ejecutado_at
  }
  crm_outbox {
    bigint id PK
    text kind "telegram|meli_pausar (+whatsapp, publicar... en fase 3)"
    jsonb payload
    text status
    timestamptz run_after
  }
```

## Vistas en español que leen agentes y dashboard (solo lectura, datos reales)

| Vista | Qué entrega |
|---|---|
| `v_repuestos` | cada repuesto con `estado` unificado (disponible / reservado / vendido / precio_pendiente / disponible_sin_publicar) y `bloqueos_publicacion` (por qué NO se puede publicar: sin_numero_parte, sin_foto, sin_imagen_promocional, precio_pendiente, sin_stock) |
| `v_leads` | las 21 etapas del CRM colapsadas en tus 5 columnas: nuevo → cotizado → seguimiento → cerrado_ganado / cerrado_perdido, más `seguimiento_vencido` |
| `v_ventas` | pedidos pagados + ventas manuales en una sola lista (fecha, total, canal, medio de pago, entrega, seguimiento) |
| `v_inventario_vehiculo` | por auto: piezas totales / disponibles / vendidas / con precio pendiente, valor del stock, **recuperado vs costo_compra** |
| `v_aprobaciones_pendientes` | la cola única: precios pendientes + publicaciones por aprobar + tareas de agentes + sugerencias del CRM |
| `v_equipo_ia` | por agente: última acción, tareas hoy, errores 7 días, esperando aprobación |
