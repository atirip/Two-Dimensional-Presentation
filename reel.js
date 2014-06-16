	
jQuery.extend( jQuery.easing, {

	wall: function(x, t, b, c, d) {
		var lim=2.5*Math.PI;
		var dx=t/d;
		var amp=Math.pow(1-Math.pow(t/d, Math.cos(t/d*2)), 2);
		return(1-Math.abs(Math.cos(lim*dx*dx))*amp)*c+b;
	},
	
	pulse: function(x, t, b, c, d) {
		var pulses = 1;
		var pos = t/d;
		return (
			Math.round((pos % (1/pulses)) * pulses) == 0 ?
			((pos * pulses * 2) - Math.floor(pos * pulses * 2)) :
			1 - ((pos * pulses * 2) - Math.floor(pos * pulses * 2))
		)*c+b;
	}
});



Function.prototype.bind || (Function.prototype.bind = function(object) {
	var method = this;
	var args = [].slice.call(arguments,1);
	return function() {
		return method.apply(object, args.concat([].slice.call(arguments,0)));
	};
});

if ( 'undefined' == typeof pp ) {
	pp = {};
}

pp.presenter = function() {
	this.init();
};

pp.presenter.prototype = {
	_debug:false,
	widths: [178,254,363,518,740],
	heights: [133,190,271,388,555],
	zoom: 3,
	width: 0,
	height: 0,
	speed: 2000,
	current: '',
	sH: 0,
	sW: 0,
	images: null,
	stack: [],
	ease: 'wall',
	dim: [],
	posJ:[],
	posI: 0,
	animating: false,
	
	init: function() {
		this.setHW();
		this.current = '#pic_0_0';
		this.stack.push(this.current);
		this.newTransition(this.current);
	},

	limit_3: function (a, b, c) {
		return a < b ? b : (a > c ? c : a);
	},

	setHW: function() {
		this.width = this.widths[this.zoom];
		this.height = this.heights[this.zoom];
	},
	
	parseId: function(id) {
		var p = id.split('_');
		return { s:p[0], i:parseInt(p[1]), j:parseInt(p[2]) };
	},
	
	makeId: function(s, id) {
		return '#' + s + '_' + id.i + '_' + id.j;
	},

	loadImages: function() {
		this.animating = false;
		if ( null == this.images ) this.images = $('.show');
		this.sH = $('body').height();
		this.sW = $('body').width();
		var self = this;
		this.images.each( function(i){ 
			var offset = $(this).offset();
			if ( offset.top < self.sH && offset.left < self.sW && (offset.top + $(this).height() > 0) && (offset.left + $(this).width() > 0) ) {
				if ( this.alt && this.src.indexOf('cd.gif') != -1 ) {
					// image
					$(this).hide();
					this.onload = function() {
						var self = this;
						setTimeout(function() {
							$(self).animate( { opacity: "show" }, 1500, 'pulse');
						}, 100);
					};
					this.src = this.alt;	
				} else {
					// flash
					var pid = self.parseId(this.id);
					var fsh = $( self.makeId( 'fsh', pid ) );
					if ( fsh.length == 1) {
						var movie = fsh.attr('movieid');
						fsh = fsh.get(0);
						if ( movie && fsh.src.length == 0 ) {
							fsh.LoadMovie(0, movie);
							fsh.src = movie;	
							fsh.StopPlay();
						}
						
					}
					
				}
			}
		});
	},

	topPos: function(i,dir) {
		return this.limit_3((this.posJ[i+dir] != undefined ? this.posJ[i+dir] : this.posJ[i]), 0, this.dim[this.posI]);
	},
	
	leftPos: function(dir) {
		return this.limit_3(this.posI + dir, 0, this.dim.length-1);
	},

	gotoNext: function(ii,jj) {
		var next = this.makeId('pic', {i:ii, j:jj});
		var last = this.current;
		if ( next != this.current && $(next).length ) {
			this.goto(next);
		}
		return this.current == last ? false : true;
	},

	flashCommand: function(id, command) {
		var fsh = $( this.makeId( 'fsh', this.parseId(id) ) );
		if ( fsh.length == 1) {
			fsh = fsh.get(0);
			switch (command) {
				case 'play':
					fsh.Rewind();
					fsh.Play();
					break;

				case 'stop':
					fsh.StopPlay();
					break;
			}
		}
	},

	horizTransition: function(id, amount, callback) {
		$(id).animate({left: amount+"px"}, this.speed, this.ease, callback);
	},
	
	vertTransition: function(id, amount, callback) {
		$(id).animate({top: amount+"px"}, this.speed, this.ease, callback);
	},
	
	newTransition: function(id, callback) {
		$(id).fadeTo(this.speed, 1, callback);
	},

	oldTransition: function(id, callback) {
		$(id).fadeTo(this.speed, 0.2, callback);
	},
	
	goto: function(toId) {
		var id = this.parseId(toId); 
		if ( '#'+toId == this.current ) {
			if ( !this.gotoNext(id.i, id.j+1)  ) {
				this.gotoNext(id.i+1, 0);
			}
			return;
		}
		var self = this;
		
		var callback = function() {
			setTimeout(self.loadImages.bind(self), self.speed/10);

		};
		
		this.flashCommand(this.current, 'stop');
		this.oldTransition(this.current);

		this.current = this.makeId('pic', id);
		this.stack.push(this.current);
		this.newTransition(this.current, this.flashCommand.bind(this, this.current, 'play') );

		if ( id.j != this.posJ[id.i] && id.i != this.posI ) {
			this.animating = true;
			this.vertTransition('#cli_'+id.i, id.j*-this.height);
			this.horizTransition('#pics', id.i*-this.width, callback);
		} else if ( id.j != this.posJ[id.i] ) {
			this.animating = true;
			this.vertTransition('#cli_'+id.i, id.j*-this.height, callback);
		} else if ( id.i != this.posI ) {
			this.animating = true;
			this.horizTransition('#pics', id.i*-this.width, callback);
		}
		
		this.posI = id.i;
		this.posJ[this.posI] = id.j;

	},

	charHandler: function(key) {
		if (!key) {
			key = event;
			key.which = key.keyCode;
		}
		var id = this.parseId(this.current);
		if ( this.animating ) return false;

		switch (key.which) {
			case 43: // +
				if ( this.zoom < (this.widths.length-1) ) {
					this.zoom++;
					this.zoomer();
				}
				break;
			
			case 45: // -
				if ( this.zoom > 0 ) {
					this.zoom--;
					this.zoomer();
				}
				break;
				
			default:
				return true;
		}
		return false;
	},

	
	keyHandler: function(key) {
		if (!key) {
			key = event;
			key.which = key.keyCode;
		}
		if ( key.shiftKey || key.ctrlKey || key.altKey || key.metaKey ) return true;
			
		var id = this.parseId(this.current);

		switch (key.which) {
			
			case 8: // backspace
				this.stack.pop(); // that's current
				var c = this.stack.pop(); // that's previous
				if ( c ) {
					this.goto(c);
				}
				break;
				
			case 10: // return
			case 13: // enter
				this.gotoNext(0, 0);
				break;

			case 32: // spacebar
				if ( !this.gotoNext(id.i, id.j+1)  ) {
					this.gotoNext(id.i+1, 0);
				}
				break;

			case 34: // page down
				var elem = $('#cli_'+id.i);
				if ( elem.length ) {
					this.gotoNext(id.i, parseInt(elem.height() / this.height) - 1);
				}
				break;
				
			case 40: // downkey
				this.gotoNext(id.i, id.j+1) ;
				break;

			case 33: // page up
				this.gotoNext(id.i, 0);
				break;
			
			case 38: // upkey
				this.gotoNext(id.i, id.j-1);
				break;

			case 37: // leftkey
				this.gotoNext( this.leftPos(-1), this.topPos(id.i, -1));
				break;

			case 39: // rightkey
				this.gotoNext( this.leftPos(1), this.topPos(id.i, 1));
				break;

			case 36: // home
				this.gotoNext(0, this.topPos(0, 0));
				break;
				
			case 35: // end
				this.gotoNext(this.dim.length-1, this.topPos(this.dim.length-1, 0));
				break;
				
			default:
				return true;
		}
		return false;
	},

	keyCanceler: function(key) {

		function cancelEvent(event) {
			if (event && event.stopPropagation)
				event.stopPropagation();
			else if (window.event)
				window.event.cancelBubble = true;
			if (event && event.preventDefault)
				event.preventDefault();
			else if (window.event)
				window.event.returnValue = false;
			return false;
		}

		if (!key) {
			key = event;
			key.which = key.keyCode;
		}
		
		if ( key.shiftKey || key.ctrlKey || key.altKey || key.metaKey ) return true;

		switch (key.which) {
			case 8: // backspace
			case 10: // return
			case 13: // enter
			case 32: // spacebar
			case 34: // page down
			case 40: // downkey
			case 33: // page up
			case 38: // upkey
			case 37: // leftkey
			case 39: // rightkey
			case 36: // home
			case 35: // end
				break;
			default:
				return true;
		}
		return cancelEvent(key);
	},

	zoomer: function() {
		this.setHW();
		var h = this.heights[this.zoom];
		var w = this.widths[this.zoom];
		$('.boxee').css({height: h, width: w});
		$('body').resize();
	}
};


function go () {

	var ppp = new pp.presenter();

	$('.pcol').each( function(i) {
		ppp.dim[i] =  $('#cli_' + i + ' .pspot').length;
		ppp.posJ[i] = 0;
	});

	$('body').resize( function(i){
		ppp.loadImages();
		for (var ii=0; ii<ppp.dim.length; ii++) {
			var amount = -ppp.posJ[ii]*ppp.height;
			$('#cli_' + ii).css('top', amount);
		}
		$('#pics').css('left', -ppp.posI*ppp.width);
	});

	$(document).keypress( function(event){
		return ppp.charHandler(event);
	});

	$(document).keyup( function(event){
		return ppp.keyHandler(event);
	});

	$(document).keydown( function(event){
		return ppp.keyCanceler(event);
	});

	$('#porte').click( function(i){
		var id = ppp.parseId(ppp.current);
		if ( !ppp.gotoNext(id.i, id.j+1)  ) {
			ppp.gotoNext(id.i+1, 0);
		}
	});

	$('.klikk').click( function(i){
		ppp.goto(this.id);
	});

	setTimeout(ppp.zoomer.bind(ppp), 500);
}
