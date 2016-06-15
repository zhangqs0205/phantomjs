"use strict";
var page = require('webpage').create(),
    system = require('system'),
    address, output, sessionId, size, pageWidth, pageHeight;

if (system.args.length < 3 || system.args.length > 5) {
    console.log('Usage: rasterize.js URL filename [paperwidth*paperheight|paperformat] [zoom]');
    console.log('  paper (pdf output) examples: "5in*7.5in", "10cm*20cm", "A4", "Letter"');
    console.log('  image (png/jpg output) examples: "1920px" entire page, window width 1920px');
    console.log('                                   "800px*600px" window, clipped to 800x600');
    phantom.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];
    sessionId = system.args[3];
    
    var login={
    		'name':'SHAREJSESSIONID',
    		'value':sessionId,
    		'domain':'localhost',
    		'httponly':false,
    		'path':'/'
    }
    
    //登录信息
    var suc= page.addCookie(login );
    
    page.viewportSize = { width: 1000, height: 600 };
    if (system.args.length > 3 && system.args[2].substr(-4) === ".pdf") {
    	page.viewportSize = { width: 800, height: 600 };
        size = system.args[3].split('*');
        page.paperSize = size.length === 2 ? { width: size[0], height: size[1], margin: '0px' }
                                           : { format: system.args[3], orientation: 'portrait', margin: '1cm' };
    } else if (system.args.length > 3 && system.args[3].substr(-2) === "px") {
        size = system.args[3].split('*');
        if (size.length === 2) {
            pageWidth = parseInt(size[0], 10);
            pageHeight = parseInt(size[1], 10);
            page.viewportSize = { width: pageWidth, height: pageHeight };
            page.clipRect = { top: 0, left: 0, width: pageWidth, height: pageHeight };
        } else {
            console.log("size:", system.args[3]);
            pageWidth = parseInt(system.args[3], 10);
            pageHeight = parseInt(pageWidth * 3/4, 10); // it's as good an assumption as any
            console.log ("pageHeight:",pageHeight);
            page.viewportSize = { width: pageWidth, height: pageHeight };
        }
    }
    if (system.args.length > 4) {
        page.zoomFactor = system.args[4];
    }
    
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit(1);
        } else {
            window.setTimeout(function () {
            	//计算报告正文的大小
            	var rect = page.evaluate(function(){
            		var preSetRect = document.getElementById("reportPreSet").getBoundingClientRect();
            		var diyRect = document.getElementById("reportDiy").getBoundingClientRect();
            		if(preSetRect&&preSetRect.top>0){
	            		return {
	            				top:preSetRect.top,
	            				left:preSetRect.left,
	            				width:preSetRect.width,
	            				height:preSetRect.height
	            		};
            		}else{
            			return {
                				top:diyRect.top,
                				left:diyRect.left,
                				width:diyRect.width,
                				height:diyRect.height
                		};
            		}
            		
            	});
            	page.clipRect=rect;
                page.render(output);
                phantom.exit();
            }, 3000);
        }
    });
}