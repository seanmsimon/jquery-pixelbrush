/*!
 * Pixelbrush (jquery.pixelbrush.js) v1.0.4
 * Copyright 2017, Sean M. Simon - http://seansimon.name
 * Based on the jquery-mosaic plugin algorithm by Nicolas Ramz / warpdesign.
 * Licensed under the MIT license.
 *
 * Version: 1.0.4
 *
 * Transparent PNGs may be used, as that is a feature that seemed to be missing from
 * the original jquery-mosaic plugin.
 *
 * Allows for implementation via data-plugin="pixelbrush" as well as direct JavaScript.
 *
 * The canvas element that is used will take all styles or classes associated with
 * the referenced image element.
 *
 *
 * Implementation:
 *
 * <img id="image-id"
 *      data-plugin="pixelbrush"
 *      data-mode="fade-in"
 *      data-loop="false"
 *      data-autostart="true"
 *      data-ignore-class="hide"
 *      data-interval="15"
 *      data-oncomplete="doSomething();"
 *      src="image-with-alpha.png"
 *      class="img-responsive hide" alt="" />
 *
 * The data-mode="" parameter can take one of 7 values: fade-in, fade-out, focus, focus-in,
 * unfocus, unfocus-out, and bounce
 *
 * Use the data-ignore-class="" parameter to specify classes being used to initially hide an image when necessary
 * (Used with fade-in, focus-in, and focus modes).
 *
 * Alternate Implementation:
 *
 * $(window).on('load', function() {
 *     $('#image-id').pixelbrush({
 *         mode: 'fade-in',
 *         loop: false,
 *         ignore_class: 'hide',
 *         interval: 15,
 *         onComplete: function() {
 *             doSomething();
 *         }
 *     });
 * });
 *
 *
 * Destruction:
 *
 * $('#image-id').pixelbrush('destroy');
 *
 *
 * Requirements:
 *
 * - jQuery - http://jquery.com
 * - newPlugin.jquery.js (v0.2.3) - Kir Peremenov (https://github.com/peremenov/jquery-factory)
 * - jquery.actual.js (v1.0.18) - Ben Lin (https://github.com/dreamerslab/jquery.actual)
 *
 *
 */

$(window).on('load', function() {
    $('img[data-plugin="pixelbrush"]').each(function() {
        if ((typeof $(this).attr('data-autostart') !== 'undefined') && ($(this).attr('data-autostart') !== false)) {
            if ($(this).attr('data-autostart') === 'true') {
                $(this).pixelbrush();
            }
        }
    });
});

(function($) {
    "use strict";
    
    var Pixelbrush = function($el, options) {
        var _this = this;
        
        _this.$el = $el;
        _this.el = $el[0];
        _this.destroyed = false;
        _this.GUID = _this.generateGUID();
        
        _this.options = $.extend({
            loop: false,
            mode: 'fade-in',
            ignore_class: '',
            interval: 15,
            onComplete: function() { }
        }, options);

        if ((typeof _this.$el.attr('data-loop') !== 'undefined') && (_this.$el.attr('data-loop') !== false)) {
            if ((_this.$el.attr('data-loop') === 'true') || (_this.$el.attr('data-loop') === '1')) {
                _this.options.loop = true;
            }
        }

        if ((typeof _this.$el.attr('data-ignore-class') !== 'undefined') && (_this.$el.attr('data-ignore-class') !== false)) {
            _this.options.ignore_class = _this.$el.attr('data-ignore-class');
        }
        
        if ((typeof _this.$el.attr('data-interval') !== 'undefined') && (_this.$el.attr('data-interval') !== false)) {
            _this.options.interval = _this.$el.attr('data-interval');
        }

        options = _this.options;
        
        if ((typeof _this.$el.attr('data-mode') !== 'undefined') && (_this.$el.attr('data-mode') !== false)) {
            switch (_this.$el.attr('data-mode')) {
                    case 'fade-in':
                    case 'fade-out':
                    case 'focus':
                    case 'focus-in':
                    case 'unfocus':
                    case 'unfocus-out':
                    case 'bounce':
                        _this.options.mode = _this.$el.attr('data-mode');
                    break;
                    default: break;
            }
        }
        
        _this.animation = {
            width: _this.$el.actual('width'),
            height: _this.$el.actual('height'),
            canvas: {
                class: _this.removeClassesToIgnore((' ' + _this.$el.attr('class') + ' '), $.trim(_this.options.ignore_class).split(' ')),
                brush: {
                    el: null,
                    context: null
                },
                palette: {
                    el: null,
                    context: null
                }
            },
            ratio: { 
                current: null,
                start: null,
                high: 1,
                low: 0.009 
            },
            step: 0.95,
            opacity: 1,
            first_loop: true
        };
        
        var canvas_style = ((typeof _this.$el.attr('style') !== 'undefined') && (_this.$el.attr('style') !== false)) ? 'style="' + _this.$el.attr('style') + '" ' : '';
        
        _this.animation.canvas.brush.el = $('<canvas ' + canvas_style + 'class="' + _this.animation.canvas.class + ' pixelbrush-canvas-' + _this.GUID + '" />').appendTo(_this.$el.parent())[0];
        _this.animation.canvas.brush.context = _this.animation.canvas.brush.el.getContext('2d');
        
        _this.animation.canvas.palette.el = $('<canvas ' + canvas_style + 'class="' + _this.animation.canvas.class + ' pixelbrush-canvas-' + _this.GUID + '" />')[0];
        _this.animation.canvas.palette.context = _this.animation.canvas.palette.el.getContext('2d');

        _this.init();
    };

    Pixelbrush.prototype.init = function() {
        var _this = this;
        
        if (_this.el.complete || (typeof _this.el.complete === 'undefined')) {
           _this.pixelate();
        } else {
            _this.$el.on('load', function() {
                _this.pixelate();
            });
        }
    };

    Pixelbrush.prototype.generateGUID = function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
    };

    Pixelbrush.prototype.prefix = function() {
        var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

        return { 
            dom: dom,
            lowercase: pre,
            css: '-' + pre + '-',
            js: pre[0].toUpperCase() + pre.substr(1) 
        };
    };

    Pixelbrush.prototype.cleanArray = function(array_of_strings) {
        var _this = this;
        
        $.each(array_of_strings, function(index, value) {
            if ($.trim(value) === '') {
                array_of_strings.splice(index, 1);

                _this.cleanArray(array_of_strings);

                return;
            }
        });

        return array_of_strings;
    };

    Pixelbrush.prototype.removeClassesToIgnore = function(classes_string_to_modify, array_of_classes_to_ignore) {
        var _this = this;
        
        array_of_classes_to_ignore = _this.cleanArray(array_of_classes_to_ignore);
        
        $.each(array_of_classes_to_ignore, function(index, value) {
            var regex = eval('/ ' + value + ' /gi');
            
            classes_string_to_modify = classes_string_to_modify.replace(regex, '');
        });

        return classes_string_to_modify;
    };

    Pixelbrush.prototype.pixelate = function() { 
        var _this = this;
        
        if (!_this.destroyed) {
            if (_this.options.mode !== 'fade-in') {
                _this.$el.css('display', 'none');
            }
            
            $(_this.animation.canvas.brush.el).css('display', 'inline-block');
    
            _this.animation.canvas.brush.el.width = _this.animation.canvas.palette.el.width = _this.animation.width;
            _this.animation.canvas.brush.el.height = _this.animation.canvas.palette.el.height = _this.animation.height;
    
            if (typeof _this.animation.canvas.brush.context.imageSmoothingEnabled === 'undefined') {
                _this.animation.canvas.brush.context[_this.prefix().lowercase + 'ImageSmoothingEnabled'] = false;
                _this.animation.canvas.palette.context[_this.prefix().lowercase + 'ImageSmoothingEnabled'] = false;
            } else {
                _this.animation.canvas.brush.context.imageSmoothingEnabled = false;
                _this.animation.canvas.palette.context.imageSmoothingEnabled = false;
            }
    
            switch (_this.options.mode) {
                case 'unfocus':
                case 'fade-out':
                    _this.animation.ratio.low = 0.019;
                break;
                case 'unfocus-out':
                case 'focus-in':
                    _this.animation.ratio.low = 0.0001;
                break;
                case 'fade-in':
                    _this.animation.opacity = 0;
                break;
                case 'bounce':
                case 'focus': break;
                default: break;
            }
    
            switch (_this.options.mode) {
                case 'bounce':
                case 'unfocus':
                case 'unfocus-out':
                case 'fade-out':
                    _this.animation.ratio.start = _this.animation.ratio.high;
                break;
                case 'focus':
                case 'focus-in':
                case 'fade-in':
                default:
                    _this.animation.ratio.start = _this.animation.ratio.low;
                break;
            }
    
            _this.animation.ratio.current = _this.animation.ratio.start;

            _this.animate(_this);
        }
    };
    
    Pixelbrush.prototype.gotoNextStep = function() {
        var _this = this;
        
        _this.animate(_this);
    };
    
    Pixelbrush.prototype.animate = function(_this) {        
        if (!_this.destroyed) { 
            _this.animation.ratio.current = _this.animation.ratio.current * _this.animation.step;

            if (_this.animation.ratio.current >= _this.animation.ratio.high) {
                _this.animation.ratio.current = _this.animation.ratio.high;
                _this.animation.step = 0.9;
                
                if (_this.options.loop) { 
                    if (_this.animation.first_loop) {
                        _this.onComplete();
                        
                        _this.animation.first_loop = false;
                    }
                    
                    switch (_this.options.mode) {
                        case 'fade-in': _this.options.mode = 'fade-out'; break;
                        case 'fade-out': _this.options.mode = 'fade-in'; break;
                        case 'focus': _this.options.mode = 'unfocus'; break;
                        case 'focus-in': _this.options.mode = 'unfocus-out'; break;
                        case 'unfocus': _this.options.mode = 'focus'; break;
                        case 'unfocus-out': _this.options.mode = 'focus-in'; break;
                        case 'bounce': break;
                        default: break;
                    }
                } else {
                    if (_this.options.mode !== 'unfocus') {
                        $(_this.animation.canvas.brush.el).css('position', 'absolute');
    
                        if (_this.options.mode !== 'fade-out') {
                            var classes_string_to_modify = ' ' + _this.$el.attr('class') + ' ',
                                array_of_classes_to_ignore = $.trim(_this.options.ignore_class).split(' ');
                                
                            _this.$el.attr('class', _this.removeClassesToIgnore(classes_string_to_modify, array_of_classes_to_ignore));
    
                            _this.$el.css('display', 'inline-block');
                        } else {
                            _this.$el.css({ 
                                display: 'inline-block',
                                visibility: 'hidden' 
                            });
                        }
    
                        $(_this.animation.canvas.brush.el).remove();
                        $(_this.animation.canvas.palette.el).remove();
    
                        _this.onComplete();
                        
                        return;
                    } else {
                        _this.onComplete();
    
                        return;
                    }
                }
            }

            if (((_this.options.mode === 'unfocus') && (_this.animation.ratio.current >= _this.animation.ratio.low)) || (_this.options.mode !== 'unfocus')) {
                _this.animation.canvas.palette.context.clearRect(0, 0, _this.animation.width, _this.animation.height);
                _this.animation.canvas.brush.context.clearRect(0, 0, _this.animation.width, _this.animation.height);
            }

            switch (_this.options.mode) {
                case 'fade-out':
                    $(_this.animation.canvas.brush.el).css('opacity', _this.animation.opacity);
                
                    if (_this.animation.opacity > 0) {
                        _this.animation.opacity -= 0.01;
                    }
                break;
                case 'fade-in':
                    $(_this.animation.canvas.brush.el).css('opacity', _this.animation.opacity);

                    if (_this.animation.opacity < 1) {
                        _this.animation.opacity += 0.01;
                    }
                break;
                default: break;
            }

            if (_this.animation.ratio.current < _this.animation.ratio.low) {
                if ((_this.options.mode === 'focus') || (_this.options.mode === 'focus-in') || (_this.options.mode === 'fade-in') || (_this.options.mode === 'bounce')) {
                    _this.animation.ratio.current = _this.animation.ratio.low;
                    _this.animation.step = 1.05;
                }
                
                if (_this.options.mode !== 'unfocus-out') {
                    if (_this.animation.step !== 1.05) {
                        if ((_this.options.mode === 'unfocus') || (_this.options.mode === 'fade-out')) {
                            if (_this.options.loop) {
                                if (_this.options.mode === 'unfocus') {
                                    _this.options.mode = 'focus';
                                } else if (_this.options.mode === 'fade-out') {
                                    _this.options.mode = 'fade-in';
                                }
                            } else {
                                _this.onComplete();

                                return;
                            }
                        }
                    }
                } else {
                    if (_this.animation.ratio.current < _this.animation.ratio.low) {
                        if (_this.options.loop) {
                            _this.animation.ratio.current = _this.animation.ratio.low;
                            _this.animation.step = 0.95;
                            _this.options.mode = 'focus-in';
                        } else {
                            $(_this.animation.canvas.brush.el).css('position', 'absolute');

                            _this.$el.css({ 
                                display: 'inline-block',
                                visibility: 'hidden' 
                            });

                            $(_this.animation.canvas.brush.el).remove();
                            $(_this.animation.canvas.palette.el).remove();

                            _this.onComplete();
                            
                            return;
                        }
                    }
                }
            }
            
            _this.animation.canvas.palette.context.drawImage(_this.el, 0, 0, _this.animation.width * _this.animation.ratio.current, _this.animation.width * _this.animation.ratio.current);
            _this.animation.canvas.brush.context.drawImage(_this.animation.canvas.palette.el, 0, 0, _this.animation.width * _this.animation.ratio.current, _this.animation.width * _this.animation.ratio.current, 0, 0, _this.animation.width, _this.animation.height);
            
            setTimeout(function() {
               _this.gotoNextStep();
            }, _this.options.interval);
        }
    };
    
    Pixelbrush.prototype.destroy = function() {
        var _this = this;
        
        $('.pixelbrush-canvas-' + _this.GUID).remove();

        _this.$el.removeData('pixelbrush');

        _this.destroyed = true;
    };
    
    Pixelbrush.prototype.onComplete = function() {
        var _this = this,
            function_body = null;
        
        if ((typeof _this.$el.attr('data-oncomplete') !== 'undefined') && (_this.$el.attr('data-oncomplete') !== false)) {
           function_body = $.trim(_this.$el.attr('data-oncomplete'));
        } else {
            function_body = $.trim(_this.options.onComplete.toString().match(/\{([\s\S]*)\}/m)[1]);
            function_body = $.trim(function_body.replace(/^\s*\/\/.*$/mg, ''));
        }

        if (!$.isEmptyObject(function_body)) {
           $('head').append('<script type=\"text/javascript\">$(function() { ' + function_body + ' });<\/script>');
        }
    };

    $.newPlugin('pixelbrush', Pixelbrush);
})(jQuery);