function elt(name, attributes) {
  var node = document.createElement(name);
  if (attributes) {
    for (var attr in attributes)
      if (attributes.hasOwnProperty(attr))
        node.setAttribute(attr, attributes[attr]);
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child == "string")
      child = document.createTextNode(child);
    node.appendChild(child);
  }
  return node;
}

var controls = {};
var panel = elt("div", {class: "picturepanel"});

function createPaint(parent) {
  var canvas = elt("canvas", {class:'lowerCanvas', width: 900, height: 500});
  var cx = canvas.getContext("2d");
  var upperCanvas = elt("canvas", {id:'upperCanvas', width: 900, height: 500});
  var ucx = upperCanvas.getContext("2d");
  //var cx = ucx;
  var toolbar = elt("div", {class: "toolbar"});
  for (var name in controls)
    toolbar.appendChild(controls[name](cx, ucx));

  panel.appendChild(canvas);
  panel.appendChild(upperCanvas);
  parent.appendChild(elt("div", null, panel));
  document.getElementById("leftbar").appendChild(toolbar);
}

var tools = {};

var layers = {}

controls.tool = function(cx, ucx) {
  var select = elt("select");
  for (var name in tools)
    select.appendChild(elt("option", null, name));

  ucx.canvas.addEventListener("mousedown", function(event) {
    if (event.which == 1) {
      tools[select.value](event, cx, ucx);
      event.preventDefault();
    }
  });

  return elt("span", {class: "toolitem"}, "Tool: ", select);
};

controls.layer = function(cx, ucx, panel) {
  var selectLayer = elt("select");
  for (var name in layers)
    selectLayer.appendChild(elt("option", null, name));

  ucx.canvas.addEventListener("mousedown", function(event) {
    if (event.which == 1) {
      layers[selectLayer.value](event, cx, ucx, panel);
      event.preventDefault();
    }
  });

  return elt("span", {class: "toolitem"}, "Layer: ", selectLayer);
};


function newLayer(panel)	{
	var count = 1;
	var canvas = elt("canvas", {class:"lowerCanvas", id:'Canvas' + count, width: 900, height: 500});
	panel.appendChild(canvas);
	count+=1;
	
}

//document.querySelector('button').addEventListener("mousemove", newLayer(panel));

//layers.NewLayer = newLayer(panel);

//line tool helpers

function relativePos(event, element) {
  var rect = element.getBoundingClientRect();
  return {x: Math.floor(event.clientX - rect.left),
          y: Math.floor(event.clientY - rect.top)};
}

function trackMouse(onPress, onMove, onEnd, onClick) {
  function end(event) {
    removeEventListener("mousedown", onPress)
    removeEventListener("mousemove", onMove);
    removeEventListener("mouseup", end);
    removeEventListener("click", onClick);
    if (onEnd)
      onEnd(event);
  }
  addEventListener("mousedown", onPress)
  addEventListener("mousemove", onMove);
  addEventListener("mouseup", end);
  addEventListener("click", onClick);

}

//line tool helpers

tools.Line = function(event, cx, ucx) {
  ucx.lineCap = "round";
  cx.lineCap = "round";
  var startX = 0;
  var endX;
  var startY = 0;
  var endY;
  trackMouse(function(event) {
  	var pos = relativePos(event, ucx.canvas);
    startX=pos.x;
    startY=pos.y;
  },function(event) {
    pos = relativePos(event, ucx.canvas);
    endX=pos.x;
    endY=pos.y;
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    ucx.beginPath();
    ucx.moveTo(startX ,startY );
    ucx.lineTo(endX, endY);
    ucx.stroke();
  }, function(event) {
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    pos = relativePos(event, ucx.canvas);
    cx.beginPath();
    cx.moveTo(startX ,startY );
    cx.lineTo(pos.x, pos.y);
    cx.stroke();
    //console.log(1);
    });
};

tools.Circle = function(event, cx, ucx)	{
	var a = 0;
	var b = 0;
	trackMouse(function(event)	{
		var pos=relativePos(event, ucx.canvas);
		a = pos.x;
		b = pos.y;
	}, function(event)	{
		var pos1=relativePos(event, ucx.canvas)
		var r = (pos1.y - b)/2;
		var x = Math.floor((pos1.x - a)/2) + a;
		var y = Math.floor((pos1.y - b)/2) + b;
		ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
		ucx.beginPath();
		ucx.arc(x, y, r, 0, 2 * Math.PI);
		ucx.stroke();
	},  function(event)	{
		ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
		var pos1=relativePos(event, ucx.canvas)
		var r = (pos1.y - b)/2;
		var x = Math.floor((pos1.x - a)/2) + a;
		var y = Math.floor((pos1.y - b)/2) + b;
		cx.beginPath();
		cx.arc(x, y, r, 0, 2 * Math.PI);
		cx.stroke();
	})


}

tools.Triangle = function(event, cx, ucx)	{
	var a = 0;
	var b = 0;
	trackMouse(function(event)	{
		var pos=relativePos(event, ucx.canvas);
		a = pos.x;
		b = pos.y;
	}, function(event)	{
		var pos1=relativePos(event, ucx.canvas)
		ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
		ucx.beginPath();
		ucx.moveTo(pos1.x, pos1.y);
		ucx.lineTo(a, pos1.y);
		ucx.lineTo((Math.floor((pos1.x - a)/2)) + a, b);
		ucx.closePath();
		ucx.stroke();
	},  function(event)	{
		ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
		var pos1=relativePos(event, cx.canvas)
		cx.beginPath();
		cx.moveTo(pos1.x, pos1.y);
		cx.lineTo(a, pos1.y);
		cx.lineTo((Math.floor((pos1.x - a)/2)) + a, b);
		cx.closePath();
		cx.stroke();
	})


}

tools.Curve = function(event, cx, ucx)	{
	ucx.lineCap = "round";
	cx.lineCap = "round";
  var startX = 0;
  var endX = 0;
  var startY = 0;
  var endY = 0;
  var cpX = 0;
  var cpY = 0;
  trackMouse(function(event) {
  	ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
  	var pos = relativePos(event, ucx.canvas);
    startX=pos.x;
    startY=pos.y;
    //console.log(startX);

  },null, function(event) {
    pos = relativePos(event, ucx.canvas);
    endX = pos.x;
    endY = pos.y;
    ucx.beginPath();
    ucx.moveTo(startX ,startY );
    //console.log(startX);
    ucx.lineTo(endX, endY);
    ucx.stroke();
    trackMouse(function(event) {
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
  	var pos = relativePos(event, cx.canvas);
    cpX=pos.x;
    cpY=pos.y;
    //console.log(endX)
    cx.beginPath();
    cx.moveTo(startX, startY);
    cx.quadraticCurveTo(cpX, cpY, endX, endY)
    cx.stroke();
    
  }, null, null)
   });
   
   
   
   

}





tools.Line2 = function(event, cx, ucx) {
  cx.lineCap = "round";
  var qos = relativePos(event, cx.canvas);
  qos.x = -1;
  qos.y = -1;
  //var startX = 0;
  //var endX;
  //var startY = 0;
  //var endY;
  /*trackMouse(null, null, function(event) {
    pos = relativePos(event, cx.canvas);
    cx.lineTo(pos.x, pos.y);
    cx.stroke();
    }, function(event) {
  	var pos = relativePos(event, cx.canvas);
    startX=pos.x;
    startY=pos.y;
    console.log(pos.x);
    cx.beginPath();
    cx.moveTo(startX ,startY );
  });*/
  begin = function(event) {
  			qos = relativePos(event, cx.canvas);
    		//startX=pos.x;
    		//startY=pos.y;
    		cx.beginPath();
    		cx.moveTo(qos.x, qos.y);
    		removeEventListener("click", begin);
    		addEventListener("mousedown", stop);
  		}
  stop = function(event) {
  	qos = relativePos(event, cx.canvas);
  	if (qos.x < 0 || qos.y < 0)	{
  		removeEventListener("mousedown", stop);
  	}
  	else	{
    cx.lineTo(qos.x, qos.y);
    cx.stroke();
    //console.log(pos.x)
    removeEventListener("mousedown", stop);
    }
    }
  addEventListener("click", begin)
  

};


tools.Freehand = function(event, cx, onEnd) {
  cx.lineCap = "round";

  var pos = relativePos(event, cx.canvas);
  trackMouse(null, function(event) {
    cx.beginPath();
    cx.moveTo(pos.x, pos.y);
    pos = relativePos(event, cx.canvas);
    cx.lineTo(pos.x, pos.y);
    cx.stroke();
  }, onEnd);
};

tools.Fill = function(event, cx)	{

trackMouse(function(event)	{
			pos=relativePos(event, cx.canvas);
			var fillRGB = [hexToRed(cx.fillStyle), hexToGreen(cx.fillStyle), hexToBlue(cx.fillStyle), 255]
			floodfill(pos.x, pos.y, fillRGB, cx, 900, 500);
			}, null, null);

function hexToRed(hexColor) {
    return parseInt(hexColor.substring(1,3),16)}

function hexToGreen(hexColor) {
    return parseInt(hexColor.substring(3,5),16)}

function hexToBlue(hexColor) {
    return parseInt(hexColor.substring(5,7),16)}

function floodfill(x,y,fillcolor,ctx,width,height,tolerance) {
	var img = ctx.getImageData(0,0,width,height);
	var data = img.data;
	var length = data.length;
	var Q = [];
	var i = (x+y*width)*4;
	var e = i, w = i, me, mw, w2 = width*4;
	var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];
	var targettotal = data[i]+data[i+1]+data[i+2]+data[i+3];
 
	if(!pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) { return false; }
	Q.push(i);
	while(Q.length) {
		i = Q.pop();
		if(pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
			e = i;
			w = i;
			mw = parseInt(i/w2)*w2; //left bound
			me = mw+w2;	//right bound			
			while(mw<(w-=4) && pixelCompareAndSet(w,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go left until edge hit
			while(me>(e+=4) && pixelCompareAndSet(e,targetcolor,targettotal,fillcolor,data,length,tolerance)); //go right until edge hit
			for(var j=w;j<e;j+=4) {
				if(j-w2>=0 		&& pixelCompare(j-w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j-w2); //queue y-1
				if(j+w2<length	&& pixelCompare(j+w2,targetcolor,targettotal,fillcolor,data,length,tolerance)) Q.push(j+w2); //queue y+1
			} 			
		}
	}
	ctx.putImageData(img,0,0);
}
 
function pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {	
	if (i<0||i>=length) return false; //out of bounds
	if (data[i+3]===0)  return true;  //surface is invisible
	
	if (
		(targetcolor[3] === fillcolor[3]) && 
		(targetcolor[0] === fillcolor[0]) && 
		(targetcolor[1] === fillcolor[1]) && 
		(targetcolor[2] === fillcolor[2])
	) return false; //target is same as fill
	
	if (
		(targetcolor[3] === data[i+3]) &&
		(targetcolor[0] === data[i]  ) && 
		(targetcolor[1] === data[i+1]) &&
		(targetcolor[2] === data[i+2])
	) return true; //target matches surface 
	
	if (
		Math.abs(targetcolor[3] - data[i+3])<=(255-tolerance) &&
		Math.abs(targetcolor[0] - data[i]  )<=tolerance && 
		Math.abs(targetcolor[1] - data[i+1])<=tolerance &&
		Math.abs(targetcolor[2] - data[i+2])<=tolerance
	) return true; //target to surface within tolerance 
	
	return false; //no match
}
 
function pixelCompareAndSet(i,targetcolor,targettotal,fillcolor,data,length,tolerance) {
	if(pixelCompare(i,targetcolor,targettotal,fillcolor,data,length,tolerance)) {
		//fill the color
		data[i] = fillcolor[0];
		data[i+1] = fillcolor[1];
		data[i+2] = fillcolor[2];
		data[i+3] = fillcolor[3];
		return true;
	}
	return false;
}



}

tools.Erase = function(event, cx) {
  cx.globalCompositeOperation = "destination-out";
  tools.Freehand(event, cx, function() {
    cx.globalCompositeOperation = "source-over";
  });
};

controls.color = function(cx, ucx) {
  var input = elt("input", {type: "color"});
  input.addEventListener("change", function() {
    cx.fillStyle = input.value;
    cx.strokeStyle = input.value;
    ucx.fillStyle = input.value;
    ucx.strokeStyle = input.value;
  });
  return elt("span", {class: "toolitem"}, "Color: ", input);
};

controls.brushSize = function(cx, ucx) {
  var select = elt("select");
  var sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];
  sizes.forEach(function(size) {
    select.appendChild(elt("option", {value: size},
                           size + " pixels"));
  });
  select.addEventListener("change", function() {
    cx.lineWidth = select.value;
    ucx.lineWidth = select.value;
  });
  return elt("span", {class: "toolitem"}, "Brush size: ", select);
};

controls.save = function(cx) {
  var link = elt("a", {href: "/", class: "toolitem"}, "Save your work");
  function update() {
    try {
      link.href = cx.canvas.toDataURL().replace('image/png', 'image/octet-stream');
    } catch (e) {
      if (e instanceof SecurityError)
        link.href = "javascript:alert(" +
          JSON.stringify("Can't save: " + e.toString()) + ")";
      else
        throw e;
    }
  }
  link.addEventListener("mouseover", update);
  link.addEventListener("focus", update);
  return link;
};

function loadImageURL(cx, url) {
  var image = document.createElement("img");
  image.addEventListener("load", function() {
    var color = cx.fillStyle, size = cx.lineWidth;
    cx.canvas.width = image.width;
    cx.canvas.height = image.height;
    cx.drawImage(image, 0, 0);
    cx.fillStyle = color;
    cx.strokeStyle = color;
    cx.lineWidth = size;
  });
  image.src = url;
}

controls.openFile = function(cx) {
  var input = elt("input", {type: "file"});
  input.addEventListener("change", function() {
    if (input.files.length == 0) return;
    var reader = new FileReader();
    reader.addEventListener("load", function() {
      loadImageURL(cx, reader.result);
    });
    reader.readAsDataURL(input.files[0]);
  });
  return elt("div", {class: "toolitem"}, "Open image: ", input);
};

tools.Text = function(event, cx) {
  var text = prompt("Text:", "");
  if (text) {
    var pos = relativePos(event, cx.canvas);
    cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
    cx.fillText(text, pos.x, pos.y);
  }
};

tools.Rectangle = function(event, cx, ucx) {
  var pos = relativePos(event, ucx.canvas);
  var pos1 = relativePos(event, ucx.canvas);
  var a;
  var b;
  
  begin = function(event) {
    //cx.beginPath();
    pos1 = relativePos(event, ucx.canvas);
    //cx.moveTo(pos1.x, pos1.y);
    a = pos.x;
    b = pos.y;
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    ucx.strokeRect(a,b,pos1.x - a, pos1.y - b);
  };
  end = function(event) {
  	ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    pos1 = relativePos(event, ucx.canvas);
    cx.strokeRect(a,b,pos1.x - a, pos1.y - b);
    //cx.stroke();
    removeEventListener('mousemove', begin);
  	removeEventListener('mouseup', end);

  };
  addEventListener('mousemove', begin);
  addEventListener('mouseup', end);
};




var x = document.querySelector("#center");
createPaint(x);