SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS nums ( 
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_num INT NOT NULL,
    operator VARCHAR(1) NOT NULL,
    last_num INT NOT NULL,
    result INT NOT NULL
);
INSERT INTO nums (first_num , operator , last_num , result) VALUES (1,"+",1,2);