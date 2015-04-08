<!--
<?php 
/**
 * ownCloud - recover
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 * @copyright Marcus Mundt 2015
 */
//    To use routes in OC_Template, use:
//    print_unescaped(\OCP\Util::linkToRoute(
        //'recover.page.get_recently_deleted', array('key' => 1)
  //          'recover.page.get_recently_deleted'
    //));
//    p("user: ".$_['user']." - ");
//    Request could not be converted to string
//    p("request: ".$_['request']." - ");
//    p("appname: ".$_['appname']." - ");

// OC trashbin list.php (in template + ajax) 
//   gut für setzen eines templates und erzeugen von liste 
// fileList CSS-stuff eigentlich aus core, nur minimale anpassungen in trash.css
// filestable -> 

?>

<div ng-controller="RecentController as recentCtrl">    
Quick Filter: <input type="text" ng-model="search"> {{search}} <br>
</div>

-->
<!--    array of objects -> use ng-repeat twice 
    was ist data-ng-repeat

    <tr ng-repeat="item in recentCtrl.items | filter:search">
            <td>{{item.filename}}</td>
            <td>{{item.timestamp}}</td>
            <td>{{item.location}}</td>
    </tr>
-->
<!-- for now just to load recent Controller in script.js 
to get filelist data 
now without angular!
<div ng-controller="RecentController as recentCtrl">    
-->

<!-- /apps/files_trashbin/templates/index.php -->
<!-- hidden viewcontainer raus! nur bei files app notwendig,
    weil je nach navi-auswahl entsprechende inhalte gezeigt werden
    -> standard files, trashbin, sharing etc.
<div id="app-content-trashbin" class="hidden viewcontainer"> 
-->
<?php 
    /** @var $l OC_L10N */ 
    /* wird ausgegeben, aber trashlist kommt nicht...
    p("in part.recent");
    p('request = '.$_['request']);
    */
    p("in part.recent");
?>
<div id="app-content-trashbin">
    <div id="controls">
        <div id="file_action_panel"></div>
    </div>
    <div id='notification'></div>

    <div id="emptycontent" class="hidden">
        <div class="icon-delete"></div>
        <h2><?php p($l->t('No deleted files')); ?></h2>
        <p><?php p($l->t('You will be able to recover deleted files from here')); ?></p>
    </div>

    <input type="hidden" name="dir" value="" id="dir">

    <div class="nofilterresults hidden">
        <div class="icon-search"></div>
        <h2><?php p($l->t('No entries found in this folder')); ?></h2>
        <p></p>
    </div>

    <table id="filestable">
        <thead>
            <tr>
                <th id='headerName' class="hidden column-name">
                    <div id="headerName-container">
                        <input type="checkbox" id="select_all_trash" class="select-all"/>
                        <label for="select_all_trash">
                            <span class="hidden-visually"><?php p($l->t('Select all'))?></span>
                        </label>
                        <a class="name sort columntitle" data-sort="name"><span><?php p($l->t( 'Name' )); ?></span><span class="sort-indicator"></span></a>
                        <span id="selectedActionsList" class='selectedActions'>
                            <a href="" class="undelete">
                                <img class="svg" alt=""
                                     src="<?php print_unescaped(OCP\image_path("core", "actions/history.svg")); ?>" />
                                <?php 
                                    // original
                                    //p($l->t('Restore'))
                                    p($l->t('Recover'))
                                ?>
                            </a>
                        </span>
                    </div>
                </th>
                <th id="headerDate" class="hidden column-mtime">
                    <a id="modified" class="columntitle" data-sort="mtime"><span><?php p($l->t( 'Deleted' )); ?></span><span class="sort-indicator"></span></a>
                    <span class="selectedActions">
                        <a href="" class="delete-selected">
                            <?php p($l->t('Delete'))?>
                            <img class="svg" alt=""
                                src="<?php print_unescaped(OCP\image_path("core", "actions/delete.svg")); ?>" />
                        </a>
                    </span>
                </th>
            </tr>
        </thead>
        <tbody id="fileList">
        </tbody>
        <tfoot>
        </tfoot>
    </table>
</div> 