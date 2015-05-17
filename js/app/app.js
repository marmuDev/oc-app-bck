/**
 * ownCloud - recover - Recover - adapted from trashbin among others
 *	
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 * @copyright Marcus Mundt 2015

	script.js in app.js, config.js, run.js und 
	weitere bestandteile wie controller etc. unterteilen
*/

if (!OCA.Files) {
		/**
		 * Namespace for the files app
		 * @namespace OCA.Files
		 */
		OCA.Files = {};
}
 
if (!OCA.Recover) {
	/**
	 * Namespace for the recover app
	 * @namespace OCA.Recover
	 */
	OCA.Recover = {};
}

/**
 * @namespace OCA.Recover.App
 */
OCA.Recover.App = _.extend({}, OCA.Files.App, {
	_initialized: false,

	initialize: function($el) {
		//console.log('in init from OCA.Recover.App - will init this.fileList = new OCA.Recover.FileList');
		if (this._initialized) {
			console.log('in init from OCA.Recover.App, initialized already true');
			return;
		}
		// obsolete - adapted files navigation
		//this.navigation = new OCA.Recover.Navigation($('#app-navigation'));
		//this.navigation.setActiveItem('recently_deleted');
		// back to constructing nav here
		//this.navigation = new OCA.Recover.Navigation(OC.generateUrl('/apps/recover/'));
		this.navigation = new OCA.Recover.Navigation($('#app-navigation'));
    	this.view = new OCA.Recover.View(navigation);
    	this.view.renderNavigation();
		
		this.fileList = new OCA.Recover.FileList(
			$('#app-content-trashbin'), {
				scrollContainer: $('#app-content'),
				fileActions: this._createFileActions()
			}
		);
		//console.log('in init of OCA.Recover.App before manual reload');
		// hack to force loading of list -> myfilelist reload -> $.ajax
		this.fileList.reload();
		// trying to solve it via http.get in recentcontroller (angular)
		// -> no, did it the trashbin-way
		// still ajax and reload/reloadCallback, but getAjaxUrl obsolete

		this._setupEvents();
		// what for? obsolete in my case?
		//this._onPopState(urlParams);
		//this._onPopState('({})');
		params = 	{
						dir: '/',
						view: 'recently_deleted'
					}
		this._onPopState(params);
		this._initialized = true;
	},

	// adapt according to file source and coresponding functions etc.
	_createFileActions: function() {
		var fileActions = new OCA.Files.FileActions();
		//console.log('_createFileAction fileActions = ' +fileActions.actions);
		fileActions.register('dir', 'Open', OC.PERMISSION_READ, '', function (filename, context) {
			var dir = context.fileList.getCurrentDirectory();
			if (dir !== '/') {
				dir = dir + '/';
			}
			context.fileList.changeDirectory(dir + filename);
		});

		fileActions.setDefault('dir', 'Open');
		// register wird nicht ausgführt!!
		fileActions.register('all', 'Recover', OC.PERMISSION_READ, OC.imagePath('core', 'actions/history'), function(filename, context) {
			var fileList = context.fileList;
			console.log('_createFileAction fileList = ' +fileList);
			var tr = fileList.findFileEl(filename);
			var deleteAction = tr.children("td.date").children(".action.delete");
			deleteAction.removeClass('icon-delete').addClass('icon-loading-small');
			fileList.disableActions();
			// AJAX path for PHP!!! => now trigger route + controller
			//$.post(OC.filePath('recover', 'ajax', 'recover.php'), {
			$.post(OC.generateUrl('/apps/recover/recover'), {
					files: JSON.stringify([filename]),
					dir: fileList.getCurrentDirectory()
				},
				_.bind(fileList._removeCallback, fileList)
			);
		}, t('recover', 'Recover'));

		fileActions.registerAction({
			name: 'Delete',
			displayName: '',
			mime: 'all',
			permissions: OC.PERMISSION_READ,
			icon: function() {
				return OC.imagePath('core', 'actions/delete');
			},
			render: function(actionSpec, isDefault, context) {
				var $actionLink = fileActions._makeActionLink(actionSpec, context);
				$actionLink.attr('original-title', t('recover', 'Delete permanently'));
				$actionLink.children('img').attr('alt', t('recover', 'Delete permanently'));
				context.$file.find('td:last').append($actionLink);
				return $actionLink;
			},
			actionHandler: function(filename, context) {
				var fileList = context.fileList;
				$('.tipsy').remove();
				var tr = fileList.findFileEl(filename);
				var deleteAction = tr.children("td.date").children(".action.delete");
				deleteAction.removeClass('icon-delete').addClass('icon-loading-small');
				fileList.disableActions();
				// adapt to route + controller
				// maybe further adapted for other file sources than OC
				//$.post(OC.filePath('recover', 'ajax', 'delete.php'), {
				$.post(OC.generateUrl('/apps/recover/delete'), {
						files: JSON.stringify([filename]),
						dir: fileList.getCurrentDirectory()
					},
					_.bind(fileList._removeCallback, fileList)
				);
			}
		});
		return fileActions;
	},

	/**
	 * Setup events based on URL changes
	 */
	_setupEvents: function() {
		OC.Util.History.addOnPopStateHandler(_.bind(this._onPopState, this));
		// detect when app changed their current directory
		// -> still done by files App
		//$('#app-content').delegate('>div', 'changeDirectory', _.bind(this._onDirectoryChanged, this));
		//$('#app-content').delegate('>div', 'changeViewerMode', _.bind(this._onChangeViewerMode, this));
		//console.log('RECOVER app _setupEvents, this = ' + this.toSource())
		// I guess obsolete, see below
		//$('#app-navigation').on('itemChanged', _.bind(this._onNavigationChanged, this));
	},

	/**
	 * Event handler for when the current navigation item has changed
	 * ONLY triggered when user clicks on nav link
	 * I guess I don't need that, only for _changeURL in my case?
	 
	_onNavigationChanged: function(e) {
		console.log('RECOVER app _onNavigationChanged, e = ' + e.toSource());
		var params;
		// active Container = 
		//console.log('RECOVER app _onNavigationChanged, nav.getActiveContainer = ' + this.navigation.getActiveContainer().toSource());
		// if not true -> not executed in RECOVER! -> no event triggered!
		if (e && e.itemId) {
			console.log('RECOVER app _onNavigationChanged in if');
			params = {
				view: e.itemId,
				dir: '/'
			};
			// not triggered?
			console.log('RECOVER _onNavigationChanged - params.view = ' + params.view + ', params.dir = ' + params.dir);
			//debugger;
			this._changeUrl(params.view, params.dir);
			// Returns the container of the currently active app.
			
			// REMOVE triggering of urlChanged EVENT?
			this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));

		}
	},
	*/

	/**
	 * Event handler for when the URL changed
	 */
	_onPopState: function(params) {
		console.log('RECOVER _onPopState anfangs params.view = ' + params.view);
		params = _.extend({
			dir: '/',
			view: 'recently_deleted'
		}, params);
		var lastId = this.navigation.getActiveLink();
		console.log('RECOVER app _onPopState, lastId = ' + lastId + ', params.view = ' + params.view);
		if (!this.navigation.itemExists(params.view)) {
			console.log('RECOVER app _onPopState, if item does not exist, params.view = "files"');
			// set initial view (active Link to recover)
			params.view = 'recently_deleted';
		}
		this.navigation.setActiveItem(params.view, '{silent: true}');
		if (lastId !== this.navigation.getActiveItem()) {
			console.log('RECOVER app _onPopState, lastId != activeItem -> trigger new event show');
			this.navigation.getActiveContainer().trigger(new $.Event('show'));
		}
		console.log('RECOVER app _onPopState, trigger event urlChanged');
		this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));
	},

	/**
	 * Change the URL to point to the given dir and view
	 * called by _onNavigationChanged
	 */
	_changeUrl: function(view, dir) {
		var params = {dir: dir};
		if (view !== 'files') {
			params.view = view;
		}
		OC.Util.History.pushState(params);
	}

	/* now recovernavigation.js
	getSearchTemplate: function() {
		$.get(OC.generateUrl('/apps/recover/search'), function(data) {
			$('#app-content').replaceAll(data)
		});
	}
	*/

});


// hack from files/js/app.js 
$(document).ready(function() {
	// wait for other apps/extensions to register their event handlers and file actions 
	// in the "ready" clause
	// also seems to be working with out defer
	//OCA.Recover.App.initialize();
	_.defer(function() { 
			OCA.Recover.App.initialize();
	});
});

/* from original trashbin app
$(document).ready(function() {
	$('#app-content-trashbin').one('show', function() {
		var App = OCA.Recover.App;
		App.initialize($('#app-content-trashbin'));
		// force breadcrumb init
		App.fileList.changeDirectory(App.fileList.getCurrentDirectory(), false, true);
	});
});
*/
