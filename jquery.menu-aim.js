/**
 * menu-aim is a jQuery plugin for dropdown menus that can differentiate
 * between a user trying hover over a dropdown item vs trying to navigate into
 * a submenu's contents.
 *
 * menu-aim assumes that you have are using a menu with submenus that expand
 * to the menu's right. It will fire events when the user's mouse enters a new
 * dropdown item *and* when that item is being intentionally hovered over.
 *
 * __________________________
 * | Monkeys  >|   Gorilla  |
 * | Gorillas >|   Content  |
 * | Chimps   >|   Here     |
 * |___________|____________|
 *
 * In the above example, "Gorillas" is selected and its submenu content is
 * being shown on the right. Imagine that the user's cursor is hovering over
 * "Gorillas." When they move their mouse into the "Gorilla Content" area, they
 * may briefly hover over "Chimps." This shouldn't close the "Gorilla Content"
 * area.
 *
 * This problem is normally solved using timeouts and delays. menu-aim tries to
 * solve this by detecting the direction of the user's mouse movement. This can
 * make for quicker transitions when navigating up and down the menu. The
 * experience is hopefully similar to amazon.com/'s "Shop by Department"
 * dropdown.
 *
 * Use like so:
 *
 *      $("#menu").menuAim({
 *          activateCallback:   $.noop, // fired on row activation
 *          deactivateCallback: $.noop  // fired on row deactivation
 *      });
 *
 *
 * https://github.com/banesto/jQuery-menu-aim
*/
;(function ( $, window, document, undefined ) {

  var pluginName  = 'menuAim',
      defaults    = {
        triggerEvent:       "hover",  // A means of activating submenu - either 'hover' or 'click' or 'both
        rowSelector:        "> li",   // Selector for identifying which elements in the menu are rows
        handle:             "> a",    // Handle for triggering mouse clicks on menu item
        submenuSelector:    "*",      // You may have some menu rows that aren't submenus and therefore
                                      // shouldn't ever need to "activate." If so, filter submenu rows w/
                                      // this selector. Defaults to "*" (all elements).
        submenuDirection:   "right",  // Direction the submenu opens relative to the main menu. Can be
                                      // left, right, above, or below. Defaults to "right".
        openClassName:      "open",   // Class that will be applied to menu item when activated

        tolerance:          75,       // Bigger = more tolerant for mouse movement precision when entering submenu
        activationDelay:    300,      // Delay (ms) for first submenu opening
        mouseLocsTracked:   3,        // Number of past mouse locations to track direction
        defaultDelay:       300,      // Delay (ms) when user appears to be entering submenu

        enterCallback:      $.noop,   // Function to call when mouse enters a menu row. Entering a row does not mean
                                      // the row has been activated, as the user may be mousing over to a submenu.
        activateCallback:   $.noop,   // Function to call when a row is purposefully activated. Use this
                                      // to show a submenu's content for the activated row.
        deactivateCallback: $.noop,   // Function to call when a row is deactivated.
        exitCallback:       $.noop,   // Function to call when mouse exits a menu row.
        exitMenuCallback:   $.noop    // Function to call when mouse exits whole menu - for autoclosing submenu
      };

  function Plugin( el, options ) {
    this.el = el;
    this.options = $.extend( {}, defaults, options);

    this._defaults = defaults;
    this._name = pluginName;

    this.init();
  }

  Plugin.prototype = {

    init: function () {
      this.activeRow    = null,
      this.mouseLocs    = [],
      this.lastDelayLoc = null,
      this.timeoutId    = null,
      this.openDelayId  = null,
      this.isOnClick    = $.inArray(this.options.triggerEvent, ['both', 'click']) > -1,
      this.isOnHover    = $.inArray(this.options.triggerEvent, ['both', 'hover']) > -1;

      /**
       * Hook up initial menu events
       */
      if (this.isOnHover) {
        this._hoverTriggerOn();
      }

      if (this.isOnClick) {
        this._clickTriggerOn();
      }
    },

    // Private methods start with underscore

    /**
     * Keep track of the last few locations of the mouse.
     */
    _mouseMoveDocument: function(e) {
      obj = e.data.obj;
      obj.mouseLocs.push({x: e.pageX, y: e.pageY});

      if (obj.mouseLocs.length > obj.options.mouseLocsTracked) {
        obj.mouseLocs.shift();
      }
    },

    /**
     * Cancel possible row activations when leaving the menu entirely
     */
    _mouseLeaveMenu: function(e) {
      obj = e.data.obj;
      if (obj.timeoutId) {
        clearTimeout(obj.timeoutId);
      }
      if (obj.openDelayId) {
        clearTimeout(obj.openDelayId);
      }

      obj._possiblyDeactivate(obj.activeRow);
      obj.options.exitMenuCallback(this);
    },

    /**
     * Trigger a possible row activation whenever entering a new row.
     */
    _mouseEnterRow: function(e) {
      obj = e.data.obj;
      if (obj.timeoutId) {
        // Cancel any previous activation delays
        clearTimeout(obj.timeoutId);
      }

      obj.options.enterCallback(this);
      obj._possiblyActivate(this);
    },

    _mouseLeaveRow: function(e) {
      e.data.obj.options.exitCallback(this);
    },

    /*
     * Immediately activate a row if the user clicks on it.
     */
    _clickRow: function(e) {
      obj = e.data.obj;
      obj._activate(this);

      // bind close event when submenu content is rendered
      $(obj.el)
        .find(obj.options.rowSelector)
          .find(obj.options.handle)
            .on('click', { obj: obj }, obj._clickRowHandle);
    },


    /*
     * Close already opened submenu
     */
    _clickRowHandle: function(e) {
      obj = e.data.obj;
      if ($(this).closest('li').hasClass(obj.options.openClassName)) {
        obj._deactivate();
        e.stopPropagation();
      }
    },

    /**
     * Activate a menu row with possible delay
     */
    _activate: function(row) {
      var obj = this;
      if (row == this.activeRow) {
        return;
      }

      if (this.openDelayId) {
        clearTimeout(this.openDelayId);
      }

      // check if delay should be placed before activation
      if (parseInt(obj.options.activationDelay, 0) > 0 && obj.isOnHover) {
        if (obj.activeRow) {
          obj._activateWithoutDelay(row);
        } else {
          this.openDelayId = setTimeout(function() {
            obj._activateWithoutDelay(row);
          },
          obj.options.activationDelay);
        }
      } else {
        obj._activateWithoutDelay(row);
      }

    },

    _activateWithoutDelay: function(row) {
      if (this.activeRow) {
        this.options.deactivateCallback(this.activeRow);
      }
      this.options.activateCallback(row);
      this.activeRow = row;
    },

    _deactivate: function() {
      if (this.openDelayId) {
        clearTimeout(this.openDelayId);
      }
      if (this.activeRow) {
        this.options.deactivateCallback(this.activeRow);
        this.activeRow = null;
      }
    },

    /**
     * Possibly activate a menu row. If mouse movement indicates that we
     * shouldn't activate yet because user may be trying to enter
     * a submenu's content, then delay and check again later.
     */
    _possiblyActivate: function(row) {
      var delay = this._activationDelay(),
          that  = this;

      if (delay) {
        this.timeoutId = setTimeout(function() {
          that._possiblyActivate(row);
        }, delay);
      } else {
        this._activate(row);
      }
    },

    _possiblyDeactivate: function(row) {
      var delay = this._activationDelay(),
          that  = this;

      if (delay) {
        this.timeoutId = setTimeout(function() {
          that._possiblyDeactivate(row);
        }, delay)
      } else {
        this.options.deactivateCallback(row);
        this.activeRow = null;
      }
    },

    /**
     * Return the amount of time that should be used as a delay before the
     * currently hovered row is activated.
     *
     * Returns 0 if the activation should happen immediately. Otherwise,
     * returns the number of milliseconds that should be delayed before
     * checking again to see if the row should be activated.
     */
    _activationDelay: function() {
      if (!this.activeRow || !$(this.activeRow).is(this.options.submenuSelector)) {
        // If there is no other submenu row already active, then
        // go ahead and activate immediately.
        return 0;
      }

      var offset = $(this.el).offset(),
          upperLeft = {
            x: offset.left,
            y: offset.top - this.options.tolerance
          },
          upperRight = {
            x: offset.left + $(this.el).outerWidth(),
            y: upperLeft.y
          },
          lowerLeft = {
            x: offset.left,
            y: offset.top + $(this.el).outerHeight() + this.options.tolerance
          },
          lowerRight = {
            x: offset.left + $(this.el).outerWidth(),
            y: lowerLeft.y
          },
          loc = this.mouseLocs[this.mouseLocs.length - 1],
          prevLoc = this.mouseLocs[0];

      if (!loc) {
        return 0;
      }

      if (!prevLoc) {
        prevLoc = loc;
      }

      if (prevLoc.x < offset.left || prevLoc.x > lowerRight.x ||
          prevLoc.y < offset.top || prevLoc.y > lowerRight.y) {
        // If the previous mouse location was outside of the entire
        // menu's bounds, immediately activate.
        return 0;
      }

      if (this.lastDelayLoc && loc.x == this.lastDelayLoc.x && loc.y == this.lastDelayLoc.y) {
        // If the mouse hasn't moved since the last time we checked
        // for activation status, immediately activate.
        return 0;
      }

      // Detect if the user is moving towards the currently activated
      // submenu.
      //
      // If the mouse is heading relatively clearly towards
      // the submenu's content, we should wait and give the user more
      // time before activating a new row. If the mouse is heading
      // elsewhere, we can immediately activate a new row.
      //
      // We detect this by calculating the slope formed between the
      // current mouse location and the upper/lower right points of
      // the menu. We do the same for the previous mouse location.
      // If the current mouse location's slopes are
      // increasing/decreasing appropriately compared to the
      // previous's, we know the user is moving toward the submenu.
      //
      // Note that since the y-axis increases as the cursor moves
      // down the screen, we are looking for the slope between the
      // cursor and the upper right corner to decrease over time, not
      // increase (somewhat counterintuitively).
      function slope(a, b) {
        return (b.y - a.y) / (b.x - a.x);
      };

      var decreasingCorner = upperRight,
          increasingCorner = lowerRight;

      // Our expectations for decreasing or increasing slope values
      // depends on which direction the submenu opens relative to the
      // main menu. By default, if the menu opens on the right, we
      // expect the slope between the cursor and the upper right
      // corner to decrease over time, as explained above. If the
      // submenu opens in a different direction, we change our slope
      // expectations.
      if (this.options.submenuDirection == "left") {
        decreasingCorner = lowerLeft;
        increasingCorner = upperLeft;
      } else if (this.options.submenuDirection == "below") {
        decreasingCorner = lowerRight;
        increasingCorner = lowerLeft;
      } else if (this.options.submenuDirection == "above") {
        decreasingCorner = upperLeft;
        increasingCorner = upperRight;
      }

      var decreasingSlope = slope(loc, decreasingCorner),
          increasingSlope = slope(loc, increasingCorner),
          prevDecreasingSlope = slope(prevLoc, decreasingCorner),
          prevIncreasingSlope = slope(prevLoc, increasingCorner);

      if (decreasingSlope < prevDecreasingSlope && increasingSlope > prevIncreasingSlope) {
        // Mouse is moving from previous location towards the
        // currently activated submenu. Delay before activating a
        // new menu row, because user may be moving into submenu.
        this.lastDelayLoc = loc;
        return this.options.defaultDelay;
      }

      this.lastDelayLoc = null;
      return 0;
    },

    // if the target isn't the container nor a descendant of the container
    _outsideMenuClick: function(e) {
      var obj = e.data.obj;
      if ($(obj.el).not(e.target) && $(obj.el).has(e.target).length === 0) {
        obj.options.deactivateCallback(obj.activeRow);
        obj.activeRow = null;
      }
    },

    _hoverTriggerOn: function() {
      $(this.el).on('mouseleave', { obj: this}, this._mouseLeaveMenu )
        .find(this.options.rowSelector)
          .on('mouseenter', { obj: this}, this._mouseEnterRow)
          .on('mouseleave', { obj: this}, this._mouseLeaveRow);
      $(window).on('blur', { obj: this }, this._mouseLeaveMenu);
      $(document).on('mousemove', { obj: this }, this._mouseMoveDocument);
    },

    _hoverTriggerOff: function() {
      $(this.el).off('mouseleave', this._mouseLeaveMenu)
        .find(this.options.rowSelector)
          .off('mouseenter', this._mouseEnterRow)
          .off('mouseleave', this._mouseLeaveRow)
      $(window).off('blur', this._mouseLeaveMenu);
      $(document).off('mousemove', { obj: this }, this._mouseMoveDocument);
    },

    _clickTriggerOn: function() {
      $(this.el).find(this.options.rowSelector)
        .on('click', { obj: this }, this._clickRow);

      // hide menu if clicked elsewere
      $(document).on('click', { obj: this }, this._outsideMenuClick);
    },

    _clickTriggerOff: function() {
      $(this.el)
        .find(this.options.rowSelector)
          .off('click', this._clickRow);
      $(document).off('click', this._outsideMenuClick);
    },


    // Public methods

    switchToHover: function() {
      this._clickTriggerOff();
      this._hoverTriggerOn();
      this.isOnHover = true;
      this.isOnClick = false;
    },

    switchToClick: function() {
      this._hoverTriggerOff();
      this._clickTriggerOn();
      this.isOnHover = false;
      this.isOnClick = true;
    }
  };


  // A lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations and allowing any
  // public function (ie. a function whose name doesn't start
  // with an underscore) to be called via the jQuery plugin,
  // e.g. $(element).defaultPluginName('functionName', arg1, arg2)
  $.fn[pluginName] = function ( options ) {
    var args = arguments;

    // Is the first parameter an object (options), or was omitted,
    // instantiate a new instance of the plugin.
    if (options === undefined || typeof options === 'object') {
      return this.each(function () {

        // Only allow the plugin to be instantiated once,
        // so we check that the element has no plugin instantiation yet
        if (!$.data(this, 'plugin_' + pluginName)) {

          // if it has no instance, create a new one,
          // pass options to our plugin constructor,
          // and store the plugin instance
          // in the elements jQuery data object.
          $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
        }
      });

    // If the first parameter is a string and it doesn't start
    // with an underscore or "contains" the `init`-function,
    // treat this as a call to a public method.
    } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

      // Cache the method call
      // to make it possible
      // to return a value
      var returns;

      this.each(function () {
        var instance = $.data(this, 'plugin_' + pluginName);

        // Tests that there's already a plugin-instance
        // and checks that the requested public method exists
        if (instance instanceof Plugin && typeof instance[options] === 'function') {

          // Call the method of our plugin instance,
          // and pass it the supplied arguments.
          returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
        }

        // Allow instances to be destroyed via the 'destroy' method
        if (options === 'destroy') {
          $.data(this, 'plugin_' + pluginName, null);
        }
      });

      // If the earlier cached method
      // gives a value back return the value,
      // otherwise return this to preserve chainability.
      return returns !== undefined ? returns : this;
    }
  };

}(jQuery, window, document));
