function makeElement(name, attributes) { //function to create elements and set their attribute
  var node = document.createElement(name);
  if (attributes) {
    for (var item in attributes)
      if (attributes.hasOwnProperty(item))
        node.setAttribute(item, attributes[item]);
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child == "string")
      child = document.createTextNode(child);
    node.appendChild(child);
  }
  return node;
}

var controls = {}; //object that stores my controls
var panel = makeElement("div", {class: "picturepanel"});

function startPainting(position) {
  var canvas = makeElement("canvas", {class:'lowerCanvas', width: 900, height: 500}); //main canvas
  var cx = canvas.getContext("2d");
  var upperCanvas = makeElement("canvas", {id:'upperCanvas', width: 900, height: 500});  //preview canvas
  var ucx = upperCanvas.getContext("2d");
  var toolbar = makeElement("div", {class: "toolbar"}); //my tools
  for (var name in controls)
    toolbar.appendChild(controls[name](cx, ucx));

  panel.appendChild(canvas);
  panel.appendChild(upperCanvas);
  position.appendChild(makeElement("div", null, panel));
  document.getElementById("leftbar").appendChild(toolbar);
}

var tools = {};

var layers = {};

controls.tool = function(cx, ucx) {
  var select = makeElement("select");
  for (var name in tools)
    select.appendChild(makeElement("option", null, name));

  ucx.canvas.addEventListener("mousedown", function(event) {
    if (event.which == 1) {
      tools[select.value](event, cx, ucx);
      event.preventDefault();
    }
  });

  return makeElement("span", {class: "toolitem"}, "Tool: ", select);
};

//line tool helpers

function relativePos(event, element) {      //track the mouse position on the canvas
  var rect = element.getBoundingClientRect();
  return {x: Math.floor(event.clientX - rect.left),
          y: Math.floor(event.clientY - rect.top)};
}

function eventControl(onPress, onMove, onEnd, onClick) { //automatically adds and removes event listeners
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

tools.Freehand = function(event, cx, onEnd) { //draw freehand
  cx.lineCap = "round";

  var pos = relativePos(event, cx.canvas);
  eventControl(null, function(event) {
    cx.beginPath();
    cx.moveTo(pos.x, pos.y);
    pos = relativePos(event, cx.canvas);
    cx.lineTo(pos.x, pos.y);
    cx.stroke();
  }, onEnd);
};

tools.Line = function(event, cx, ucx) {
  ucx.lineCap = "round";
  cx.lineCap = "round";
  var startX = 0;
  var endX;
  var startY = 0;
  var endY;
  eventControl(function(event) {
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
    });
};

tools.Line2 = function(event, cx, ucx) { // joint click line
  cx.lineCap = "round";
  begin = function(event) {
  			qos = relativePos(event, cx.canvas);
    		cx.beginPath();
    		cx.moveTo(qos.x, qos.y);
    		removeEventListener("click", begin);
    		addEventListener("mousedown", stop);
  		}
  stop = function(event) {
  	qos = relativePos(event, cx.canvas);
  	if (qos.x < 0 || qos.y < 0)	{
  		removeEventListener("mousedown", stop);
  		removeEventListener("click", begin);
  		ucx.canvas.removeEventListener("mousedown", tools.Line2);
  		return;
  	}
  	else	{
    cx.lineTo(qos.x, qos.y);
    cx.stroke();
    	if (qos.x < 0 || qos.y < 0)	{
  		removeEventListener("mousedown", stop);
  		removeEventListener("click", begin);
  		ucx.canvas.removeEventListener("mousedown", tools.Line2);
  		return;
		}
    }
    }
  addEventListener("click", begin)
  

};

tools.Curve = function(event, cx, ucx)	{ //draws a curve
	ucx.lineCap = "round";
	cx.lineCap = "round";
  var startX = 0;
  var endX = 0;
  var startY = 0;
  var endY = 0;
  var cpX = 0;
  var cpY = 0;
  eventControl(function(event) {
  	ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
  	var pos = relativePos(event, ucx.canvas);
    startX=pos.x;
    startY=pos.y;

  },null, function(event) {
    pos = relativePos(event, ucx.canvas);
    endX = pos.x;
    endY = pos.y;
    ucx.beginPath();
    ucx.moveTo(startX ,startY );
    ucx.lineTo(endX, endY);
    ucx.stroke();
    eventControl(function(event) {
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
  	var pos = relativePos(event, cx.canvas);
    cpX=pos.x;
    cpY=pos.y;
    cx.beginPath();
    cx.moveTo(startX, startY);
    cx.quadraticCurveTo(cpX, cpY, endX, endY)
    cx.stroke();}, null, null)
  });
 
   
}

tools.Circle = function(event, cx, ucx)	{ //draws a circle
	var a = 0;
	var b = 0;
	eventControl(function(event)	{
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

tools.Triangle = function(event, cx, ucx)	{ //draws a triangle
	var a = 0;
	var b = 0;
	eventControl(function(event)	{
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

tools.Text = function(event, cx) { // add a text to your background
  var text = prompt("Text:", "");
  if (text) {
    var pos = relativePos(event, cx.canvas);
    cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
    cx.fillText(text, pos.x, pos.y);
  }
};

tools.Rectangle = function(event, cx, ucx) { // draw a rectangle
  var pos = relativePos(event, ucx.canvas);
  var pos1 = relativePos(event, ucx.canvas);
  var a;
  var b;
  
  begin = function(event) {
    pos1 = relativePos(event, ucx.canvas);
    a = pos.x;
    b = pos.y;
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    ucx.strokeRect(a,b,pos1.x - a, pos1.y - b);
  };
  end = function(event) {
  	ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    pos1 = relativePos(event, ucx.canvas);
    cx.strokeRect(a,b,pos1.x - a, pos1.y - b);
    removeEventListener('mousemove', begin);
  	removeEventListener('mouseup', end);

  };
  addEventListener('mousemove', begin);
  addEventListener('mouseup', end);
};


tools.Fill = function(event, cx)	{ // fill with a color

eventControl(function(event)	{
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

function floodfill(x,y,fillcolor,ctx,width,height) {
	var img = ctx.getImageData(0,0,width,height);
	var data = img.data;
	var length = data.length;
	var Q = [];
	var i = (x+y*width)*4;
	var e = i, w = i, me, mw, w2 = width*4;
	var targetcolor = [data[i],data[i+1],data[i+2],data[i+3]];
	 
	if(!pixelCompare(i,targetcolor,fillcolor,data,length)) { return false; }
	Q.push(i);
	while(Q.length) {
		i = Q.pop();
		if(pixelCompareAndSet(i,targetcolor,fillcolor,data,length)) {
			e = i;
			w = i;
			mw = parseInt(i/w2)*w2; //left bound
			me = mw+w2;	//right bound			
			while(mw<(w-=4) && pixelCompareAndSet(w,targetcolor,fillcolor,data,length)); //go left until edge hit
			while(me>(e+=4) && pixelCompareAndSet(e,targetcolor,fillcolor,data,length)); //go right until edge hit
			for(var j=w;j<e;j+=4) {
				if(j-w2>=0 		&& pixelCompare(j-w2,targetcolor,fillcolor,data,length)) Q.push(j-w2); //queue y-1
				if(j+w2<length	&& pixelCompare(j+w2,targetcolor,fillcolor,data,length)) Q.push(j+w2); //queue y+1
			} 			
		}
	}
	ctx.putImageData(img,0,0);
}
 
function pixelCompare(i,targetcolor,fillcolor,data,length) {	
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
	
	return false; //no match
}
 
function pixelCompareAndSet(i,targetcolor,fillcolor,data,length) {
	if(pixelCompare(i,targetcolor,fillcolor,data,length)) {
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

tools.Erase = function(event, cx) { //an eraser of course
  cx.globalCompositeOperation = "destination-out";
  tools.Freehand(event, cx, function() {
    cx.globalCompositeOperation = "source-over";
  });
};

controls.brushSize = function(cx, ucx) { //set the size of your text or your brush
  var select = makeElement("select");
  var sizes = [1, 2, 3, 5, 8, 12, 25, 35, 50, 75, 100];
  sizes.forEach(function(size) {
    select.appendChild(makeElement("option", {value: size},
                           size + " pixels"));
  });
  select.addEventListener("change", function() {
    cx.lineWidth = select.value;
    ucx.lineWidth = select.value;
  });
  return makeElement("span", {class: "toolitem"}, "Brush size: ", select);
};

controls.color = function(cx, ucx) {
  var input = makeElement("input", {type: "color"});
  input.addEventListener("change", function() {
    cx.fillStyle = input.value;
    cx.strokeStyle = input.value;
    ucx.fillStyle = input.value;
    ucx.strokeStyle = input.value;
  });
  return makeElement("span", {class: "toolitem"}, "Color: ", input);
};

controls.clear = function(cx, ucx) {
  var clearCanvas = makeElement("button", {id:"clear", width: 30, height: 30}, "Clear");
  clearCanvas.addEventListener("click", function() {
    ucx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
    cx.clearRect(0,0,cx.canvas.width,cx.canvas.height);
  });
  return makeElement("span", {class: "toolitem"}, clearCanvas);
};

controls.save = function(cx) { // save your silly crap
  var link = makeElement("a", {href: "/", class: "toolitem"}, "Save your work");
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
    cx.drawImage(image, 0, 0, 900, 500);
    cx.fillStyle = color;
    cx.strokeStyle = color;
    cx.lineWidth = size;
  });
  image.src = url;
}

controls.openFile = function(cx) { // open an image as your background
  var input = makeElement("input", {type: "file"});
  input.addEventListener("change", function() {
    if (input.files.length == 0) return;
    var reader = new FileReader();
    reader.addEventListener("load", function() {
      loadImageURL(cx, reader.result);
    });
    reader.readAsDataURL(input.files[0]);
  });
  return makeElement("div", {class: "toolitem"}, "Open image: ", input);
};





var x = document.querySelector("#center");
startPainting(x); //starts the code