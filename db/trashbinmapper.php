<?php

/**
 * ownCloud - mynewapp
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 * @copyright Marcus Mundt 2014
 */

namespace OCA\MyNewApp\Db;

use \OCP\IDb;
use \OCP\AppFramework\Db\Mapper;

/**
 * Description of TrashBinMapper
 * For querying data defined in trashbinitem.php
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 */
class TrashBinMapper extends Mapper {

    public function __construct(IDb $idb) {
        parent::__construct($idb, 'files_trash'); // tablename
    }

    /**
     * Always use ? to mark placeholders for arguments in SQL queries and
     * pass the arguments as a second parameter to the execute function
     * to prevent SQL Injection
     * should be limited to XXX entities,
     * if first select doesn't show wanted files,
     * then there there should be a "next" button,
     * triggering another sql select
     * @param type $userId
     * @return
     */
    public function find($userId){
        $sql = 'SELECT * FROM `' . $this->getTableName() . '` ' .
        'WHERE `user` = ? ';
        return $this->findEntities($sql, [$userId]);
    }

}