CREATE TABLE IF NOT EXISTS disparo_automations (
  id VARCHAR(80) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(60) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  published TINYINT(1) NOT NULL DEFAULT 0,
  sending_enabled TINYINT(1) NOT NULL DEFAULT 0,
  configuration JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO disparo_automations
(id, name, category, status, enabled, published, sending_enabled)
VALUES
(
  'digitale-newsletter',
  'Novos inscritos na Newsletter',
  'newsletter',
  'draft', 0, 0, 0
),
(
  'digitale-clientes',
  'Base de Clientes',
  'clientes',
  'draft', 0, 0, 0
),
(
  'digitale-interesse',
  'Interesse no Site',
  'interesse',
  'draft', 0, 0, 0
)
ON DUPLICATE KEY UPDATE id = id;
