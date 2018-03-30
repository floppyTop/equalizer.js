var Equalizer = (function () {
    
    'use strict';
        
    var publicAPI   = {},
        breakpoints = [],
        settings,
        defaults    = {
          breakpoints: {
              small: 480,
              medium: 640,
              large: 1024,
              xlarge: 1200
          }  
        };
        
    // Polyfills
    ///////////////////////////
    (function() {
        // Custom Event Polyfill for IE
        // see: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
        if( window.CustomEvent !== 'function' ) { return; }
        
        function CustomEvent ( event, params ) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent( 'CustomEvent' );
            evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
            return evt;
        }
        
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();
    
    (function() {        
        // Optimized Resize Event Listener with full browser support (IE 9+, Safari, Chrome, Firefox)
        var throttle = function(type, name, obj) {
            obj = obj || window;
            var running = false;
            var func = function() {
                if (running) { return; }
                    running = true;
                    requestAnimationFrame(function() {
                    obj.dispatchEvent(new CustomEvent(name));
                    running = false;
                });
            };
            obj.addEventListener(type, func);
        };
        throttle("resize", "optimizedResize");
    })();
    
    
    /*!
     * Merge two or more objects together.
     * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
     * @param   {Boolean}  deep     If true, do a deep (or recursive) merge [optional]
     * @param   {Object}   objects  The objects to merge together
     * @returns {Object}            Merged values of defaults and options
     */
    var extend = function () {
    	// Variables
    	var extended = {};
    	var deep = false;
    	var i = 0;
    	// Check if a deep merge
    	if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
    	    deep = arguments[0];
    	    i++;
    	}
    	// Merge the object into the extended object
    	var merge = function (obj) {
    		for (var prop in obj) {
    			if (obj.hasOwnProperty(prop)) {
    				// If property is an object, merge properties
    				if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
    					extended[prop] = extend(extended[prop], obj[prop]);
    				} else {
    					extended[prop] = obj[prop];
    				}
    			}
    		}
    	};
    	// Loop through each object and conduct a merge
    	for (; i < arguments.length; i++) {
    		var obj = arguments[i];
    		merge(obj);
    	}
    	return extended;
    };
    
    
    publicAPI.init = function(options) {        
        settings = extend(defaults, options || {});
        
        // Add state class to root element
        document.documentElement.classList.add('equalizer-active');
        
        // Parse breakpoints
        settings.breakpoints = parseBreakpoints(settings.breakpoints); 
        
        console.log(settings);
        
        equalizeGroups();
        
        window.addEventListener('optimizedResize', equalizeGroups);
    };
    
    publicAPI.destroy = function() {
        // Remove state class to root element
        document.documentElement.classList.remove('equalizer-active');
        
        var $elements = document.querySelectorAll('[data-equalizer]');
        
        resetHeight($elements);        
    };
    
    function equalizeGroups() {
        console.log('Equalizing Groups...');
        var $groups = document.querySelectorAll('[data-equalizer-row]');
        
        // Loop through each group
        for( var i = 0; i < $groups.length; i++ ) {
            
            var $group     = $groups[i],
                groupName  = $group.getAttribute('data-equalizer-row'),
                $items     = $group.querySelectorAll('[data-equalizer]'),
                equalizeOn = $group.getAttribute('data-equalizer-on');
            
            // If no breakpoint(s) are set for equalization, equalize at all breakpoints
            if( equalizeOn == null || equalizeOn === '' ) {
                equalizeOn = 'all';  
            }    
            else if( equalizeOn  ) {
                // Build array of breakpoints to equalize on
                equalizeOn  = equalizeOn.replace(/ /g, '').split(',');
            }
            
            // If a group name has been specified, find children with this group name
            if( groupName ) {
                $items = $group.querySelectorAll('[data-equalizer-group="' + groupName + '"]');
            }
            
            // If items were found
            if( $items.length ) {
                
                console.log(equalizeOn);
                
                // Reset items height
                resetHeight($items)
                
                if( Array.isArray(equalizeOn) ) {
                    for( var index = 0; index < equalizeOn.length; index++ ) {
                        var minWidth  = equalizeOn[i].minWidth,
                            mqMin     = '(min-width: ' + minWidth + 'px)',
                            mq        = mqMin,
                            maxWidth,
                            mqMax;
                            
                        console.log(equalizeOn[i]);
                        
                        // If the maxHeight property exists...
                        if( 'maxWidth' in settings.breakpoints[ equalizeOn[i] ] ) {
                            maxWidth  = settings.breakpoints[ equalizeOn[i] ].maxWidth;
                            mqMax     = ' and (max-width: ' + maxWidth + 'px)';
                            mq       += mqMax;
                        }
                        
                        if( matchMedia(mq).matches ) {
                            equalizeHeight($items);
                        }
                    }
                }
                else {
                    equalizeHeight($items);
                }
                
                return $items;
            }
        }
        
    }
    
    function currentBreakpoint() {
        var windowWidth = window.innerWidth;
        
        for( var i = 0; i < settings.breakpoints.length; i++ ) {
           // 
        }
    }
    
    // Equalizes the height of a list of elements
    function equalizeHeight($elements) {
        var maxHeight  = 0;
        
        for( var i = 0; i < $elements.length; i++ ) {
            var height = $elements[i].clientHeight;
            
            if( height > maxHeight ) {
                maxHeight = height;
            }
        }
        
        for( var index = 0; index < $elements.length; index++ ) {
            $elements[index].style.height = maxHeight + 'px'; 
        }        
    }
    
    // Resets height of elements to "auto"
    function resetHeight($elements) {
        for( var i = 0; i < $elements.length; i++ ) {
            $elements[i].style.height = 'auto';
        }
    }
    
    function parseBreakpoints(breakpoints) {
        
        breakpoints = breakpoints || {};
        
        var breakpointsList = [];
        
        // Load breakpoints into an array for sorting
        for(var breakpoint in breakpoints) {
            
            // Convert value to a number
            var value = parseInt(breakpoints[breakpoint], 10);
            
            // If value isn't a number..
            if( isNaN(value) ) {
                break;
            }
            else {
                // If value is a number...
                
                breakpointsList.push({name: breakpoint, minWidth: value});
            }            
        }
        
        // Sort breakpoints
        
        breakpointsList = breakpointsList.sort(function(a, b) {
            return ( a.minWidth < b.minWidth ) ? -1 : 1;
        });
        
        for( var i = 0; i < breakpointsList.length; i++ ) {
            
            var breakpointMax = 9999;

            if( typeof breakpointsList[i + 1] !== 'undefined' ) {
                breakpointMax = breakpointsList[i + 1].minWidth - 1;
            }
            
            breakpointsList[i].maxWidth = breakpointMax;
        }
        
        return breakpointsList;
        
    }  	
    publicAPI.parseBreakpoints = parseBreakpoints;
    
          
    return publicAPI;

})();
