-- Exact schema matching your existing devops_monitor.monitors table in AWS RDS
-- (Run only if creating the table fresh — it already exists with these columns)

CREATE TABLE IF NOT EXISTS monitors (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL,
  title        VARCHAR(100) NOT NULL,
  target       VARCHAR(255) NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  last_latency INT          NOT NULL DEFAULT 0,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
