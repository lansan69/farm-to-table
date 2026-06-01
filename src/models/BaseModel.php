<?php
require_once __DIR__ . '/../core/Database.php';

abstract class BaseModel
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }
}
