/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define([
  "../lib/Base",
  "../lib/jquery",
  "amd!../lib/underscore",
  "amd!../lib/backbone",
  "../Logger",
  "../dashboard/Utils"
], function(Base, $, _, Backbone, Logger, Utils) {

  return Base.extend(Backbone.Events).extend(/** @lends cdf.components.BaseComponent# */{
    /**
     * @summary Name of the component
     * @description The name of the component. Its name needs to be unique in the dashboard that they belong
     * @type {string}
     */
    name: undefined,
    
    /**
     * @summary Type of the component
     * @description The Type of the component. Usually is the class name of the component
     * @type {string}
     */
    type: undefined,

    /**
     * @summary Html id where the component is rendered
     * @description The Html object id, unique in the html page, where the component is rendered
     * @type {string}
     */
    htmlObject: undefined,

    /**
     * @summary Visibility flag
     *
     * @type {boolean}
     * @default true
     */
    visible: true,

    /**
     * @summary Managed flag
     *
     * @type {boolean}
     * @default true
     */
    isManaged: true,

    // Properties for handling timer function

    /**
     * @summary Start date for the timer start
     *
     * @type {number}
     * @default 0
     */
    timerStart: 0,

    /**
     * @summary Start date for the timer split
     *
     * @type {number}
     * @default 0
     */
    timerSplit: 0,

    /**
     * @summary Number of milliseconds since timer split
     *
     * @type {number}
     * @default -1
     */
    elapsedSinceSplit: -1,

    /**
     * @summary Number of milliseconds since timer start
     *
     * @type {number}
     * @default -1
     */
    elapsedSinceStart: -1,

    /**
     * @summary Color to use while logging messages
     *
     * @type {string}
     * @default undefined
     */
    logColor: undefined,

    /**
     * @summary The contructor of a BaseComponent
     * @description Constructs a BaseComponent
     *
     * @constructs
     * @classdesc The BaseComponent. Module that holds everything related to components.
     * @extends {@link http://dean.edwards.name/weblog/2006/03/base/|Base}
     * @extends {@link http://backbonejs.org/#Events|Backbone.Events}
     * @amd cdf/components/BaseComponent
     * @param {object} properties Additional properties to be extended to the instance.
     */
    constructor: function(properties) {
      this.extend(properties);
    },

    /**
     * @summary Getter for the component's html object 
     * @description Getter for the component's html object. Returns the jquery element that represents it
     *
     * @param {string} selector Optional selector to use inside the html object.
     * @return {jQuery|string} A {@link http://api.jquery.com/|jQuery} object that references the matched
     *                  DOM elements or a new object if no match is found.
     */
    placeholder: function(selector) {
      var ho = this.htmlObject;
      return ho ? $("#" + ho + (selector ? (" " + selector) : "")) : $();
    },

    /**
     * @summary Focus the first placeholder html element on the component
     * @description Focus the first placeholder html element on the component 
     */
    focus: function() {
      try {
        this.placeholder("*:first").focus();
      } catch(ex) { /* Swallow, maybe hidden. */ }
    },

    /**
     * @summary Autofocus on the component
     * @description  Autofocus on the component
     *
     * @private
     * @deprecated
     * @static
     */
    _doAutoFocus: function() {
      if(this.autoFocus) {
        delete this.autoFocus;
        this.focus();
      }
    },

    /**
     * @summary Clears the component html element
     * @description Clears the component html element
     */
    clear: function() {
      this.placeholder().empty();
    },

    /**
     * @summary General copy events methods
     * @description General copy events methods. Given a target object and an event list,
     * adds the target object as listener for all events in the list.
     *
     * @param {cdf.components.BaseComponent} target The target BaseComponent object.
     * @param {Backbone.Events[]} events {@link http://backbonejs.org/#Events|Backbone.Events} list to copy.
     */
    copyEvents: function(target, events) {
      _.each(events, function(evt, evtName) {
        var e = evt,
            tail = evt.tail;
        while((e = e.next) !== tail) {
          target.on(evtName, e.callback, e.context);
        }
      });
    },

    /**
     * @summary Clones a component
     * @description Clones a component
     *
     * @param {cdf.dashboard.parameter[]}      parameterRemap Map containing parameter remapping.
     * @param {cdf.components.BaseComponent[]} componentRemap Map containing component remapping.
     * @param {HTMLElement[]}                  htmlRemap      Map containing HTML object remapping.
     * @return {cdf.components.BaseComponent} The cloned component.
     */
    clone: function(parameterRemap, componentRemap, htmlRemap) {
      var that, dashboard, callbacks;
      /*
       * `dashboard` points back to this component, so we need to remove it from
       * the original component before cloning, lest we enter an infinite loop.
       * `_events` contains the event bindings for the `Backbone.Events` mixin
       * and may also point back to the dashboard. We want to clone that as well,
       * but have to be careful about it.
       */
      dashboard = this.dashboard;
      callbacks = this._events;
      delete this.dashboard;
      delete this._events;
      that = $.extend(true, {}, this);
      that.dashboard = this.dashboard = dashboard;
      this._events = callbacks;
      this.copyEvents(that, callbacks);

      if(that.parameters) {
        that.parameters = that.parameters.map(function(param) {
          if(param[1] in parameterRemap) {
            return [param[0], parameterRemap[param[1]]];
          } else {
            return param;
          }
        });
      }
      if(that.components) {
        that.components = that.components.map(function(comp) {
          if(comp in componentRemap) {
            return componentRemap[comp];
          } else {
            return comp;
          }
        });
      }
      that.htmlObject = !that.htmlObject ? undefined : htmlRemap[that.htmlObject];
      if(that.listeners) {
        that.listeners = that.listeners.map(function(param) {
          if(param in parameterRemap) {
            return parameterRemap[param];
          } else {
            return param;
          }
        });
      }
      if(that.parameter && that.parameter in parameterRemap) {
        that.parameter = parameterRemap[that.parameter];
      }
      return that;
    },

    /**
     * @summary Gets an addIn for this component
     * @description Gets an addIn for this component
     *
     * @param {object} slot  Add-in sub type.
     * @param {string} addIn Add-in name.
     * @return {cdf.AddIn} Add-in registered with the specified name and sub type.
     */
    getAddIn: function(slot, addIn) {
      if(!this.dashboard) {
        Logger.warn("dashboard not yet defined, can't call getAddIn");
        return false;
      }
      var type = typeof this.type == "function" ? this.type() : this.type;
      return this.dashboard.getAddIn(type, slot, addIn);
    },

    /**
     * @summary Returns true is an addIn with given sub type and name exists
     * @description Returns true is an addIn with given sub type and name exists
     *
     * @param {object} slot  Add-in sub type.
     * @param {string} addIn Add-in name.
     * @return {boolean} _true_ if the addIn exists, _false_ otherwise.
     */
    hasAddIn: function(slot, addIn) {
      if(!this.dashboard) {
        Logger.warn("dashboard not yet defined, can't call hasAddIn");
        return false;
      }
      var type = typeof this.type == "function" ? this.type() : this.type;
      return this.dashboard.hasAddIn(type, slot, addIn);
    },

    /**
     * @summary Gets the values array property
     * @description Gets the values array property, if one is defined.
     * Otherwise, issues a call to the server to get data.
     *
     * @return {object[]} An array with values from the values array property or the data retrieved from the server.
     * @deprecated
     */
    getValuesArray: function() {
      var jXML;
      if(typeof(this.valuesArray) == 'undefined' || this.valuesArray.length == 0) {
        if(typeof(this.queryDefinition) != 'undefined') {

          var vid = (this.queryDefinition.queryType == "sql") ? "sql" : "none";
          if((this.queryDefinition.queryType == "mdx") && (!this.valueAsId)) {
            vid = "mdx";
          } else if(this.queryDefinition.dataAccessId !== undefined && !this.valueAsId) {
            vid = 'cda';
          }
          QueryComponent.makeQuery(this);
          var myArray = new Array();
          for(p in this.result) if(this.result.hasOwnProperty(p)) {
            switch(vid) {
              case "sql":
                myArray.push([this.result[p][0], this.result[p][1]]);
                break;
              case "mdx":
                myArray.push([this.result[p][1], this.result[p][0]]);
                break;
              case 'cda':
                myArray.push([this.result[p][0], this.result[p][1]]);
                break;
              default:
                myArray.push([this.result[p][0], this.result[p][0]]);
                break;
            }
          }
          return myArray;
        } else {

          if(!this.dashboard) {
            Logger.warn("dashboard not yet defined, returning an empty array");
            return [];
          }

          //go through parameter array and update values
          var p = new Array(this.parameters ? this.parameters.length : 0);
          for(var i = 0, len = p.length; i < len; i++) {
            var key = this.parameters[i][0];
            var value = this.parameters[i][1] == "" || this.parameters[i][1] == "NIL"
              ? this.parameters[i][2] : this.dashboard.getParameterValue(this.parameters[i][1]);
            p[i] = [key, value];
          }

          //execute the xaction to populate the selector
          var myself = this;
          if(this.url) {
            var arr = {};
            $.each(p, function(i, val) {
              arr[val[0]] = val[1];
            });
            jXML = this.dashboard.parseXActionResult(myself, this.dashboard.urlAction(this.url, arr));
          } else {
            jXML = this.dashboard.callPentahoAction(myself, this.solution, this.path, this.action, p, null);
          }
          //transform the result int a javascript array
          return this.parseArray(jXML, false);
        }
      } else {
        return this.valuesArray;
      }
    },

    /**
     * @summary Builds an array given data received from the server in another format
     * @description Builds an array given data received from the server in another format.
     * 
     * @param {object} jData          Data object (Xaction or CDA) resulting from a call to the server.
     * @param {boolean} includeHeader A boolean indicating whether the resulting array should include the headers.
     * @return {object[]} The parsed data array.
     * @deprecated
     */
    parseArray: function(jData, includeHeader) {

      if(jData === null) {
        return []; //we got an error...
      }

      if($(jData).find("CdaExport").size() > 0) {
        return this.parseArrayCda(jData, includeHeader);
      }

      var myArray = new Array();

      var jHeaders = $(jData).find("COLUMN-HDR-ITEM");
      if(includeHeader && jHeaders.size() > 0) {
        var _a = new Array();
        jHeaders.each(function() {
          _a.push($(this).text());
        });
        myArray.push(_a);
      }

      var jDetails = $(jData).find("DATA-ROW");
      jDetails.each(function() {
        var _a = new Array();
        $(this).children("DATA-ITEM").each(function() {
          _a.push($(this).text());
        });
        myArray.push(_a);
      });

      return myArray;

    },

    /**
     * @summary Builds an array given data received
     * @description Builds an array given data received from the server in CDA format. 
     *
     * @param {object}  jData         Data object (CDA format) resulting from a call to the server.
     * @param {boolean} includeHeader A boolean indicating whether the resulting array should include the headers.
     * @return {object[]} data array
     * @deprecated
     */
    parseArrayCda: function(jData, includeHeader) {
      //ToDo: refactor with parseArray?..use as parseArray?..
      var myArray = new Array();

      var jHeaders = $(jData).find("ColumnMetaData");
      if(jHeaders.size() > 0) {
        if(includeHeader) {//get column names
          var _a = new Array();
          jHeaders.each(function() {
            _a.push($(this).attr("name"));
          });
          myArray.push(_a);
        }
      }

      //get contents
      var jDetails = $(jData).find("Row");
      jDetails.each(function() {
        var _a = new Array();
        $(this).children("Col").each(function() {
          _a.push($(this).text());
        });
        myArray.push(_a);
      });

      return myArray;
    },

    setAddInDefaults: function(slot, addIn, defaults) {
      Logger.log("BaseComponent.setAddInDefaults was removed. You should call setAddInOptions or dashboard.setAddInDefaults");
    },

    /**
     * @summary Sets the options for an addIn
     * @description Sets the options for an addIn 
     *
     * @param {object} slot    The add-in subtype.
     * @param {string} addIn   The add-in name.
     * @param {object} options An object with the options to use.
     */
    setAddInOptions: function(slot, addIn, options) {
      if(!this.addInOptions) {
        this.addInOptions = {};
      }

      if(!this.addInOptions[slot]) {
        this.addInOptions[slot] = {};
      }
      this.addInOptions[slot][addIn] = options
    },

    /**
     * @summary Gets an addIn options
     * @description Gets an addIn options
     * 
     * @param {object} slot  The add-in subtype.
     * @param {string} addIn The add-in name.
     * @return {object} The options associated with the specified add-in.
     */
    getAddInOptions: function(slot, addIn) {
      var opts = null;
      try {
        opts = this.addInOptions[slot][addIn];
      } catch(e) {
        /* opts is still null, no problem */
      }
      /* opts is falsy if null or undefined */
      return opts || {};
    },

    /**
     * @summary Starts a timer
     * @description  Starts a timer
     *
     * @private
     */
    startTimer: function() {

      this.timerStart = new Date();
      this.timerSplit = new Date();

    },

    /**
     * @summary Marks a split time in the timer
     * @description Marks a split time in the timer 
     *
     * @return {TimerInfo} The timer info.
     * @private
     */
    splitTimer: function() {

      // Sanity check, in case this component doesn't follow the correct workflow
      if(this.elapsedSinceStart === -1 || this.elapsedSinceSplit === -1) {
        this.startTimer();
      }

      var now = new Date();

      this.elapsedSinceStart = now.getTime() - this.timerStart.getTime();
      this.elapsedSinceSplit = now.getTime() - this.timerSplit.getTime();

      this.timerSplit = now;
      return this.getTimerInfo();
    },

    /**
     * @summary Formats time display
     * @description Formats time display given a number of milliseconds 
     *
     * @param {number} t Number of milliseconds.
     * @return {string} The formatted string.
     * @private
     */
    formatTimeDisplay: function(t) {
      return Math.log(t) / Math.log(10) >= 3 ? Math.round(t / 100) / 10 + "s" : t + "ms";
    },

    /**
     * The TimerInfo object.
     *
     * @typedef {object} cdf.components.BaseComponent.TimerInfo
     * @property {number} timerStart            The timer start date.
     * @property {number} timerSplit            The timer split value.
     * @property {number} elapsedSinceStart     Number of milliseconds since timer start.
     * @property {string} elapsedSinceStartDesc The formatted time since timer start.
     * @property {number} elapsedSinceSplit     Number of milliseconds since timer split.
     * @property {string} elapsedSinceSplitDesc The formatted time since timer split.
     */

    /**
     * @summary Gets timer info
     * @description Gets timer info
     *
     * @return {TimerInfo} The timer info.
     * @private
     */
    getTimerInfo: function() {

      return {
        timerStart: this.timerStart,
        timerSplit: this.timerSplit,
        elapsedSinceStart: this.elapsedSinceStart,
        elapsedSinceStartDesc: this.formatTimeDisplay(this.elapsedSinceStart),
        elapsedSinceSplit: this.elapsedSinceSplit,
        elapsedSinceSplitDesc: this.formatTimeDisplay(this.elapsedSinceSplit)
      };
    },

    /**
     * @summary Gets the color for messages
     * @description This method assigns and returns a unique and somewhat randomish color for
     * this log. The goal is to be able to track cdf lifecycle more easily in
     * the console logs. We're returning a Hue value between 0 and 360, a range between 0
     * and 75 for saturation and between 45 and 80 for value.
     *
     * @return {string} The color used for logging messages.
     * @private
     */
    getLogColor: function() {

      if(this.logColor) {
        return this.logColor;
      } else {
        // generate a unique,
        var hashCode = function(str) {
          var hash = 0;
          if(str.length == 0) {
            return hash;
          }
          for(var i = 0; i < str.length; i++) {
            var chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash = hash & hash; // Convert to 32bit integer
          }
          return hash;
        };

        var hash = hashCode(this.name).toString();
        var hueSeed = hash.substr(hash.length - 6, 2) || 0;
        var saturationSeed = hash.substr(hash.length - 2, 2) || 0;
        var valueSeed = hash.substr(hash.length - 4, 2) || 0;

        this.logColor = Utils.hsvToRgb(
          360 / 100 * hueSeed,
          75 / 100 * saturationSeed,
          45 + (80 - 45) / 100 * valueSeed);

        return this.logColor;
      }
    }
  });

});