# jQuery Pixelbrush

*Pixelbrush (jquery.pixelbrush.js) v1.0.4* \
*Copyright 2017, Sean M. Simon - http://seansimon.name* \
*Based on the jquery-mosaic plugin algorithm by Nicolas Ramz / warpdesign.* \
*Licensed under the MIT license.*

**_Version: 1.0.4_**

- Transparent PNGs may be used, as that is a feature that seemed to be missing from the original jquery-mosaic plugin.
- Allows for implementation via **data-plugin="pixelbrush"** as well as direct JavaScript.
- The canvas element that is used will take all styles or classes associated with the referenced image element.

<hr />
<br />

You can find an example usage at <a href="http://seansimon.name" target="_blank">http://seansimon.name</a>
<br />
<center>
   <img src="http://seansimon.name/jquery-pixelbrush/images/demo-screenshots-sm.png" alt="" />
</center>
<br />
<hr />

### Implementation
```html
<img id="image-id"
     data-plugin="pixelbrush"
     data-mode="fade-in"
     data-loop="false"
     data-autostart="true"
     data-ignore-class="hide"
     data-interval="15"
     data-oncomplete="doSomething();"
     src="image-with-alpha.png"
     class="img-responsive hide" alt="" />
```

The **data-mode=""** parameter can take one of 7 values: **fade-in**, **fade-out**, **focus**, **focus-in**, **unfocus**, **unfocus-out**, and **bounce**

Use the **data-ignore-class=""** parameter to specify classes being used to initially hide an image when necessary (Used with fade-in, focus-in, and focus modes).

### Alternate Implementation
```js
$(window).on('load', function() {
    $('#image-id').pixelbrush({
        mode: 'fade-in',
        loop: false,
        ignore_class: 'hide',
        interval: 15,
        onComplete: function() {
            doSomething();
        }
    });
});
```

### Destruction
```js
$('#image-id').pixelbrush('destroy');
```

### Requirements
- **jQuery** - http://jquery.com
- **newPlugin.jquery.js** (jquery-factory v0.2.3) - *Kir Peremenov* (https://github.com/peremenov/jquery-factory)
- **jquery.actual.js** (jquery.actual v1.0.18) - *Ben Lin* (https://github.com/dreamerslab/jquery.actual)

