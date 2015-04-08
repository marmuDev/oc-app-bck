/**
 * ownCloud - recover - adapted from OC Core Recover filelist.js
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Marcus Mundt <marmu@mailbox.tu-berlin.de>
 * @copyright Marcus Mundt 2015
 */
var app = angular.module('recover', []);
app.config(function($httpProvider, $provide) {
    'use strict';
    console.log('in config.js oben');
    $httpProvider.defaults.headers.common.requesttoken = oc_requesttoken;
    // wie wo so definieren, dass alle darauf zugriff haben -> config-service?
    $provide.constant('BASE_URL', OC.generateUrl('/apps/recover'));
    console.log('in config.js ende');
});
