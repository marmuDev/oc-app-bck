/**
 * ownCloud - recover - filelist
 *	adapted from OC Core files_trashbin and files filelist.js 
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 * @copyright Marcus Mundt 2015
 */
(function() {
    'use strict';
    var DELETED_REGEXP = new RegExp(/^(.+)\.d[0-9]+$/);
    // how to define? in script.js (angular) ok, here -> "$provide is undefined"
    // hab ich bereits in angular module config, nix doppelt machen!!!
    //$provide.constant('BASE_URL', OC.generateUrl('/apps/recover'));
    /**
     * Convert a file name in the format filename.d12345 to the real file name.
     * This will use basename.
     * The name will not be changed if it has no ".d12345" suffix.
     * @param {String} name file name
     * @return {String} converted file name
     */
    function getDeletedFileName(name) {
        name = OC.basename(name);
        var match = DELETED_REGEXP.exec(name);
        if (match && match.length > 1) {
                name = match[1];
        }
        return name;
    }

    /**
     * @class OCA.Recover.FileList
     * @augments OCA.Files.FileList
     * @classdesc List of deleted files
     *
     * @param $el container element with existing markup for the #controls
     * and a table
     * @param [options] map of options
     */
    var FileList = function($el, options) {
            this.initialize($el, options);
    };
    FileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
        /** @lends OCA.Recover.FileList.prototype */ {
        id: 'recover',
        appName: 'Recover',
        /**
        * Current source of filelist
        * now in Recover App
        * @type String
        */
        //_currentSource: null,
        /**
         * @private
         */
        initialize: function() {
            if (this._initialized) {
                    console.log('RECOVER filelist already initialized')
                    return;
            }
            var result = OCA.Files.FileList.prototype.initialize.apply(this, arguments);
            // recover text/icon after selecting file(s)
            this.$el.find('.undelete').click('click', _.bind(this._onClickRestoreSelected, this));
            this.setSort('mtime', 'desc');
            // adaption to set path
            this.breadcrumb.setDirectory('/');
            /**
             * Override crumb making to add "Deleted Files" entry
             * and convert files with ".d" extensions to a more
             * user friendly name.
             */
            this.breadcrumb._makeCrumbs = function() {
                    var parts = OCA.Files.BreadCrumb.prototype._makeCrumbs.apply(this, arguments);
                    for (var i = 1; i < parts.length; i++) {
                            parts[i].name = getDeletedFileName(parts[i].name);
                            //console.log("parts[i].name = " + parts[i].name);
                    }
                    return parts;
            };
            console.log('RECOVER init filelist');
            OC.Plugins.attach('OCA.Recover.FileList', this);
            return result;
        },

        /**
         * Override to only return read permissions
         */
        getDirectoryPermissions: function() {
            return OC.PERMISSION_READ | OC.PERMISSION_DELETE;
        },

        _setCurrentDir: function(targetDir) {
            OCA.Files.FileList.prototype._setCurrentDir.apply(this, arguments);

            var baseDir = OC.basename(targetDir);
            if (baseDir !== '') {
                    this.setPageTitle(getDeletedFileName(baseDir));
            }
            // never printed! since this runs Files FileList!
            //console.log('RECOVER _setCurrentDir, baseDir = ' + baseDir);
        },
        // putting source and snapshot in App, since they won't be available in
        // filelist when reloading it
        // source saved in mimetype, would be better to use "source:" 
        _setCurrentSource: function(source) {
            console.log('RECOVER filelist setCurrentSource = ' + source);
            OCA.Recover.App._currentSource = source;
        },
        getCurrentSource: function() {
            // this is undefined! at this point in time! same problem as before
            // -> put in app class!
            // should not reinit a new filelist, but clear and reload?
            //      only creating new filelist after clicking nav, reload when clicking folder
            //console.log('RECOVER filelist getCurrentSource = ' + OCA.Recover.App._currentSource);
            return OCA.Recover.App._currentSource;
        },
        _setCurrentSnapshot: function(snapshot) {
            console.log('RECOVER filelist setCurrentSnapshot = ' + snapshot);
            OCA.Recover.App._currentSnapshot = snapshot;
        },
        getCurrentSnapshot: function() {
            // this is undefined! at this point in time! same problem as before
            // -> put in app class! see above
            return OCA.Recover.App._currentSnapshot;
        },
        // all files still exist / ok here
        _createRow: function() {
            // FIXME: MEGAHACK until we find a better solution
            var tr = OCA.Files.FileList.prototype._createRow.apply(this, arguments);
            tr.find('td.filesize').remove();
            //console.log('in createRow  this.files[0].displayName = ' + this.files[0].displayName); 
            return tr;
        },
        // also ok when reloading trashbin
        _renderRow: function(fileData, options) {
            options = options || {};
            var dir = this.getCurrentDirectory();
            var dirListing = dir !== '' && dir !== '/';
            // show deleted time as mtime
            if (fileData.mtime) {
                    fileData.mtime = parseInt(fileData.mtime, 10);
            }
            if (!dirListing) {
                    fileData.displayName = fileData.name;
                    fileData.name = fileData.name + '.d' + Math.floor(fileData.mtime / 1000);
            }
            //console.log('in renderRow fileData.displayName = ' + fileData.displayName); 
            return OCA.Files.FileList.prototype._renderRow.call(this, fileData, options);
        },

        /**
         * Reloads the file list
         *
         * @return ajax object (still?)
         */

        reload: function() {
            console.log('RECOVER filelist reload anfang!');
            /* only defined if not initial load! 
            // reinit only after click on nav
            // is uninitialized when clickin on folder!
            // how to check here? file info in filelist needs to be updated to have info on source
            // but this info won't be available at this time -> app.js
            
            */
            // hier keine anpassung von dir, das stimmt dank changeDirectory, 
            // only set source in AJAX data correctly!
            // just to have it defined
            var dir = this.getCurrentDirectory();
            if (dir !== '/') {
                var source = this.getCurrentSource();
                var snapshot = this.getCurrentSnapshot();
            }
            var sort = this._sort;
            var sortdirection = this._sortDirection;
            
            //debugger;
            //console.log('in reload  URL = ' + OC.generateUrl('/apps/recover/trashlist')); 
            this._selectedFiles = {};
            // bei erneutem reload null -> if? jetzt testweise erstmal raus -> dann this.$el is null
            this._selectionSummary.clear();
            this.$el.find('.select-all').prop('checked', false);
            this.showMask();
            // -> params ok, aber http get kackt ab,
            // route didn't match "/trashlist?dir=...."

            if (this._reloadCall) {
                    this._reloadCall.abort();
            }
            // call this directly for reloading trash list? no
            this._reloadCall = $.ajax({
                //url: 'http://localhost/core/index.php/apps/recover/trashlist', 
                //url : OC.generateUrl('/apps/recover/trashlist'),
                // wieder mit data und $_GET vars
                //url : OC.generateUrl('/apps/recover/listbackups/'+ dir + '/' + source + '/' + sort + '/' + sortdirection),
                url: OC.generateUrl('/apps/recover/listbackups'),
                // params should be put in URL for routes + pagecontroller to work!
                // instead of being accessed via PHP $_GET vars
                // route url: '/listbackups{dir}/-/{source}/{sort}/{sortdirection}'
                data: {
                    // problem when reloading trashbin, it should use root, not last folder?
                    // kept for now, but should use params via URL
                    'dir': dir,
                    'source': source,
                    'sort': sort,
                    'sortdirection': sortdirection,
                    'snapshot': snapshot
                }
               
            });
            console.log('RECOVER filelist reload, current dir = ' + this.getCurrentDirectory() + ', sort = ' + this._sort + ', sortdirection = ' + this._sortDirection + ', source = ' + source);
            // nochmal ohne source
            //console.log('RECOVER filelist reload, current dir = ' + this.getCurrentDirectory() + ', sort = ' + this._sort + ', sortdirection = ' + this._sortDirection );
            var callBack = this.reloadCallback.bind(this);
            return this._reloadCall.then(callBack, callBack);
        },

        /** from files/js/filelist
         *  
         **/
        reloadCallback: function(result) {
            delete this._reloadCall;
            this.hideMask();
            // result.status undefined -> use statusCode
            //console.log("myfilelist reloadCallback result.status = " + result.status);
            //if (!result || result.status === 'error') {
            if (!result || result.statusCode === '500') {
                // if the error is not related to folder we're trying to load, reload the page to handle logout etc
                if (result.data.error === 'authentication_error' ||
                        result.data.error === 'token_expired' ||
                        result.data.error === 'application_not_enabled'
                ) {
                        console.log('in reloadCallback redirect to files app');
                        OC.redirect(OC.generateUrl('apps/files'));
                }
                OC.Notification.show(result.data.message);
                return false;
            }

            if (result.status === 404) {
                // go back home
                console.log('in reloadCallback 404 -> go back home');
                this.changeDirectory('/');
                return false;
            }
            // aborted ?
            if (result.status === 0){
                return true;
            }

            // TODO: should rather return upload file size through
            // the files list ajax call
            this.updateStorageStatistics(true);
            if (result.data.permissions) {
                this.setDirectoryPermissions(result.data.permissions);
            }
            // original -> sends files-array to files/js/filelist.js
            // set files seems ok
            this.setFiles(result.data.files);
            //console.log('end of reloadCallback in recover file list (setFiles), files = ' + result.data.files.toSource());
            return true;
        },

        setupUploadEvents: function() {
                // override and do nothing
        },

        /* ??? to be adapted? YES!
            http://api.owncloud.org/classes/OCP.Util.html#linkTo
            linkTo(string $app, string $file, array $args) : string
            Deprecated 8.1.0 Use \OC::$server->getURLGenerator()->linkTo($app, $file, $args)
                    -> I don't want linkTo($app, $file, $args), since using App Framework and routes!
         * at least there is one "/" too much
                WHAT IS THIS FOR, for now only creates a href link for file and folder,
                which seems not to be used. since using onClickFile event...
         */
        linkTo: function(dir){
            // why encode and replace, when result is again the original dir from above...
            //console.log('RECOVER file list linkTo dir ENCODED = ' + encodeURIComponent(dir));
            //console.log('RECOVER file list linkTo dir ENCODED + Replace = ' + encodeURIComponent(dir).replace(/%2F/g, '/'));
            //console.log('RECOVER linkTo = ' + OC.linkTo('files', 'index.php')+"?view=Recover&dir="+ encodeURIComponent(dir).replace(/%2F/g, '/'));

            //return OC.linkTo('files', 'index.php')+"?view=Recover&dir="+ encodeURIComponent(dir).replace(/%2F/g, '/');
            // hack to replace one of the two "/" (slashes)
            //dir = dir.replace('', '/');

            /* source of problem maybe onClickFile in FILES filelist, further redirection issue
            dir = dir.substr(1, dir.length - 1);
            console.log('dir substr = ' + dir); // -> one slash, ok!
            */
            //dir = dir.substr(1, dir.length - 1);
            //var genUrl = OC.generateUrl('/apps/recoverT/trashlist?dir=' + encodeURIComponent(dir).replace(/%2F/g, '/'));
            var genUrl = OC.generateUrl('/apps/recover/trashlist?dir=' + encodeURIComponent(dir).replace(/%2F/g, '/'));
            console.log('RECOVER linkTo genUrl = ' + genUrl);
            return genUrl;
            // linkToRoute? is not a function! 
                    // seems to be PHP only!
            // ohne linkTo passiert nichts

            // -> redirect to files app
            //var linkTo = OC.linkTo('recover')+"?dir="+ encodeURIComponent(dir).replace(/%2F/g, '/');
            //console.log('RECOVER filelist linkTo = ' + linkTo);
            //return linkTo;

            // redirect error http://localhost/core/index.php/apps/recover/trashlist?dir=//folder1.d1429801627
        },

        /**
         * this.fileList = List of rows (table tbody) = <tbody id="fileList">
         * rows are added with files/js/filelist.js: add: function(fileData, options)
         * 	but appended to table in 
         * 		@param {OCA.Files.FileInfo} fileData map of file attributes
         * 		@param {Object} [options] map of attributes
         *		...
         * called by at least self.add( 
         * 	
         **/
        updateEmptyContent: function(){
            var exists = this.$fileList.find('tr:first').exists();
            this.$el.find('#emptycontent').toggleClass('hidden', exists);
            this.$el.find('#filestable th').toggleClass('hidden', !exists);
        },

        /**  used when deleting entries from the list, delete and recover **/
        _removeCallback: function(result) {
            console.log("RECOVER removeCallback oben");
            //if (result.status !== 'success') {
            if (result.statusCode !== '200') {
                    console.log('RECOVER filelist _removeCallback result.statusCode = ' + result.statusCode);
                    // triggers "unnecessary" Error Message...
                    // t not useable since transiflex translation not implemented?
                    OC.dialogs.alert(result.data.message, t('recover', 'Error'));
            }
            else {
                OC.dialogs.alert(result.data.message, t('recover', 'Info'));
            }
            var files = result.data.success;
            //console.log(' _removeCallback files = result.data.success[0].filename = ' + result.data.success[0].filename);
            var $el;
            for (var i = 0; i < files.length; i++) {
                    $el = this.remove(OC.basename(files[i].filename), {updateSummary: false});
                    this.fileSummary.remove({type: $el.attr('data-type'), size: $el.attr('data-size')});
            }
            this.fileSummary.update();
            this.updateEmptyContent();
            this.enableActions();
        },
        /* only used, when (multiple) files have been selected 
         * NOT when directly clicking 'recover'!
         * When clicking on recover ==> App: fileActions.register "recover"
         */
        _onClickRestoreSelected: function(event) {
            event.preventDefault();
            var self = this;
            var allFiles = this.$el.find('.select-all').is(':checked');
            var files = [];
            var dir = this.getCurrentDirectory();
            var sources = [];
            var snapshotIds = [];
            var params = {};
            this.disableActions();
            // loop has to get source and snapshot of file, when all files are selected
            // --> allfiles obsolete
            files = _.pluck(this.getSelectedFiles(), 'name');
            
            // checking for every file 
            //  good: files may be from different sources
            //  bad: costs performance, when only one source has to be recovered
            for (var i = 0; i < files.length; i++) {
                var deleteAction = this.findFileEl(files[i]).children("td.date").children(".action.delete");
                deleteAction.removeClass('icon-delete').addClass('icon-loading-small');
                // if dir = /, push current file's source and snapshot in array
                // further: only if source isn't oc-trash bin
                // otherwise source and snapshot are the same within a directory
                // data-etag = snapshot, data-mime=source
                
                // Returns the tr element for a given file name
                // -> OCA.Recover.App.fileList.findFileEl("snap_3_file3.d1443271478").attr("data-etag")
                if (dir === "/") {
                    if (this.findFileEl(files[i]).attr("data-mime") === 'tubfsss'){
                        sources.push(this.findFileEl(files[i]).attr("data-mime"));
                        snapshotIds.push(this.findFileEl(files[i]).attr("data-etag"));
                    }
                }
            }
            if (dir === "/") {
                params = {
                    files: JSON.stringify(files),
                    dir: dir,
                    sources: JSON.stringify(sources),
                    snapshotIds: JSON.stringify(snapshotIds)
                };
            }
            else {
                // alternative: like above only using first array element
                //sources.push(this.findFileEl(files[0]).attr("data-mime"));
                //snapshotIds.push(this.findFileEl(files[0]).attr("data-etag"));
                params = {
                    files: JSON.stringify(files),
                    dir: dir,
                    sources: this.getCurrentSource(),
                    snapshotIds: this.getCurrentSnapshot()
                };
            }
            /*
            console.log('RECOVER filelist RestoreSelected currentDir = ' + dir);
            console.log('RECOVER filelist RestoreSelected files = ' + files);
            console.log('RECOVER filelist RestoreSelected Sources = ' + params.sources);
            console.log('RECOVER filelist RestoreSelected Snapshots = ' + params.snapshotIds);
            */
            $.post(OC.generateUrl('/apps/recover/recover'), 
                params,
                function(result) {
                    // allfiles obsolete, was only implemented for oc trash bin
                    // show message after successful recovery of file(s) 
                    // now only in removeCallback, since allfiles was removed
                    self._removeCallback(result);
                }
            );
        },
        /* delete not implemented, just deactivate
        _onClickDeleteSelected: function(event) {
            event.preventDefault();
            var self = this;
            var allFiles = this.$el.find('.select-all').is(':checked');
            var files = [];
            var params = {};
            if (allFiles) {
                    params = {
                            allfiles: true,
                            dir: this.getCurrentDirectory()
                    };
            }
            else {
                    files = _.pluck(this.getSelectedFiles(), 'name');
                    params = {
                            files: JSON.stringify(files),
                            dir: this.getCurrentDirectory()
                    };
            }

            this.disableActions();
            if (allFiles) {
                    this.showMask();
            }
            else {
                for (var i = 0; i < files.length; i++) {
                    var deleteAction = this.findFileEl(files[i]).children("td.date").children(".action.delete");
                    deleteAction.removeClass('icon-delete').addClass('icon-loading-small');
                }
            }

            //$.post(OC.filePath('recover', 'ajax', 'delete.php'),
            $.post(OC.generateUrl('/apps/recover/delete'),
                params,
                function(result) {
                    if (allFiles) {
                        //if (result.status !== 'success') {
                        if (result.statusCode !== '200') {
                            OC.dialogs.alert(result.data.message, t('recover', 'Error'));
                        }
                        self.hideMask();
                        // simply remove all files
                        self.setFiles([]);
                        self.enableActions();
                    }
                    else {
                        self._removeCallback(result);
                    }
                }
            );
        },
        */
        _onClickFile: function(event) {
            // need to get source of dir, if clicked file is dir
            //var type = this.fileActions.getCurrentType();
            // immer alter wert! hängt nen click hinter her!
            //console.log('RECOVER filelist _onClick this.fileActions.getCurrentType() = ' + this.fileActions.getCurrentType());
            var $tr = $(event.target).closest('tr');
            this.fileActions.currentFile = $tr.find('td');
            //console.log('current file/dir = ' +this.fileActions.currentFile.toString());
            var type = this.fileActions.getCurrentType();
            //console.log('RECOVER _onClickFile type = ' + type);
            if (type === 'dir') {
                console.log('RECOVER filelist _onClickFile type = dir' );
            }
            var mime = $(this).parent().parent().data('mime');
            // trying this in reload above! 
            // -> source important here and in changeDir, set parentId (snapshot) only in here
            var mimeType = this.fileActions.getCurrentMimeType();
            if (mimeType === 'ext4' || 'gpfsss' || 'tubfsss') {
                console.log('RECOVER filelist _onClickFile mimeType = ' + mimeType);
                // look at mime above, would this be possible for source too??! 
                // this.fileActions.currentFile.parent().data('mime')
                //var parentId = this.fileActions.getCurrentSnapshot();
                //console.log('RECOVER filelist _onClickFile: parentId = ' + parentId);
                var snapshot = this.fileActions.currentFile.parent().attr('data-etag');
                this._setCurrentSnapshot(snapshot);
            }
            
            // if not clicking on dir? (keep, but never seems to be the case)
            if (mime !== 'httpd/unix-directory') {
                // deprecated? there was something in the JS console,     
                // getPreventDefault() sollte nicht mehr verwendet werden. Verwenden Sie stattdessen defaultPrevented. jquery.min.js:5:0
                event.preventDefault();
            }
            return OCA.Files.FileList.prototype._onClickFile.apply(this, arguments);
        },
        // what for ? -> must be adapted to use framework (route + controller)
        // isn't run, when should it be run?
        generatePreviewUrl: function(urlSpec) {
            console.log('in generatePreviewUrl');
            return OC.generateUrl('/apps/recover/ajax/preview.php?') + $.param(urlSpec);
        },

        getDownloadUrl: function() {
            // no downloads
            return '#';
        },

        enableActions: function() {
            //console.log('in enableActions');
            this.$el.find('.action').css('display', 'inline');
            this.$el.find(':input:checkbox').css('display', 'inline');
        },

        disableActions: function() {
            this.$el.find('.action').css('display', 'none');
            this.$el.find(':input:checkbox').css('display', 'none');
        },

        updateStorageStatistics: function() {
            // no op because the Recover doesn't have
            // storage info like free space / used space
        },

        isSelectedDeletable: function() {
            return true;
        },
        /**
        * @brief Changes the current directory and reload the file list.
        * @param targetDir target directory (non URL encoded)
        * @param changeUrl false if the URL must not be changed (defaults to true)
        * @param {boolean} force set to true to force changing directory
        */
       changeDirectory: function(targetDir, changeUrl, force) {
           console.log('RECOVER filelist changeDirectory, targetDir = ' + targetDir);     
           var self = this;
                var currentDir = this.getCurrentDirectory();
                targetDir = targetDir || '/';
                if (!force && currentDir === targetDir) {
                       console.log('RECOVER filelist changeDirectory, !force && currentDir === targetDir');
                       console.log('RECOVER filelist changeDirectory, currentDir = ' + currentDir + ' targetDir = ' + targetDir);
                       return;
                }
                // get source -> undefined won't work
                //var source = this.getSource();
                // using MimeType in data.files to note (external) source
                var source = this.fileActions.getCurrentMimeType();
                // future proof (long-term reliability)???
                if (source === "application/octet-stream") {
                    this._setCurrentSource('octrash');
                } else {
                    this._setCurrentSource(source);
                }
                source = this.getCurrentSource();  
                // edit targetDir: if ".d1437995265" and files from external source requested, remove last 12 chars .d1437995265 (mtime)
                console.log('RECOVER filelist changeDirectory, targetDir before source check = ' + targetDir + ', source = ' + source);
                // if in root, directories got .dmtime at the end of dir name
                // To do: check would be obsolete, if that never is the case
                if (source !== 'octrash' && currentDir === '/') {
                    // exernal source -> edit targetDir
                    targetDir = OCA.Recover.App.removeMtime(targetDir);
                }
                this._setCurrentDir(targetDir, changeUrl);
                this.reload().then(function(success){
                    if (!success) {
                        console.log('RECOVER filelist changeDirectory, this.reload no success -> changeDirectory(currentDir, true), currentDir = ' + currentDir);
                        self.changeDirectory(currentDir, true);
                    }
                    console.log('RECOVER filelist changeDirectory, this.reload success');
                });
               console.log('RECOVER filelist changeDirectory, targetDir = ' + targetDir + ' USES getCurrentMimeType for SOURCE!');
       }
    });
    OCA.Recover.FileList = FileList;
})();