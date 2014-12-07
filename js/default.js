var CTX_INPUT, CTX_TEST, CTX_BEST, cgbest;
var SUBPIXELS;
var DATA_INPUT;
function draw_shape(ctx, shape, color) {
	ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
	ctx.beginPath();
	ctx.moveTo(shape[0].x, shape[0].y);
	for (var i in shape) {
		ctx.lineTo(shape[i].x, shape[i].y);
	}
	ctx.closePath();
	ctx.fill();
}

function draw_dna(ctx, dna, callback) {
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
	for (i = 0; i < dna.length; i++) {
		draw_shape(ctx, dna[i].shape, dna[i].color);
	}
	setTimeout(callback, 0);
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function rand_int(maxval) {
	return Math.round(maxval * Math.random());
}

function rand_float(maxval) {
	return maxval * Math.random();
}

function clamp(val, minval, maxval) {
	if (val < minval) return minval;
	if (val > maxval) return maxval;
	return val;
}
var rrate = 0.1;
function dna_cross(dna1, dna2) {
	if (dna1.length != dna2.length)
		return;
	var a = rand_int(dna1.length - 1);
	var b = rand_int(dna1.length - a - 2) + a + 1;
	var m1 = dna1.slice(a, b);
	var m2 = dna2.slice(a, b);
	var prob = Math.random();
	if (prob < rrate)
		m1 = m1.reverse();
	prob = Math.random();
	if (prob < rrate)
		m2 = m2.reverse();

	var res = {
		dna_out1: dna1.slice(0, a).concat(m2.concat(dna1.slice(b, dna1.length))),
		dna_out2: dna2.slice(0, a).concat(m1.concat(dna2.slice(b, dna2.length)))
	};
	if (res.dna_out1.length != dna1.length)
		throw "length didn't match.";
	if (res.dna_out2.length != dna1.length)
		throw "length didn't match.";
	return JSON.parse(JSON.stringify(res));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var bell_distributions = new Array(0);
var bell_offsets = new Array(0);

function rand_bell(range, center) {
	var dist = bell_distributions[range];
	if (!dist) {
		dist = bell_precompute(range, range / 6, 40);
	}
	var off = bell_offsets[range];
	return center + dist[off[-center] + Math.floor((off[range - center + 1] - off[-center]) * Math.random())];
}

function bell_precompute(range, spread, resolution) {
	var accumulator = 0;
	var step = 1 / resolution;
	var dist = new Array();
	var off = new Array();
	var index = 0;

	for (var x = -range - 1; x <= range + 1; x++) {
		off[x] = index;
		accumulator = step + Math.exp(-x * x / 2 / spread / spread);
		while (accumulator >= step) {
			if (x != 0) dist[index++] = x;
			accumulator -= step;
		}

	}
	bell_offsets[range] = off;
	return bell_distributions[range] = dist;
}

function test_bell(count, range, center) {
	var bell_tests = new Array(0);
	for (var i = 0; i < count; i++) {
		var r = rand_bell(range, center);
		if (bell_tests[r]) bell_tests[r] = bell_tests[r] + 1;
		else bell_tests[r] = 1;
	}
	draw_dist(CTX_TEST, bell_tests);
}

function draw_dist(ctx, dist) {
	var current = dist[0];
	var count = 0;
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
	ctx.fillStyle = "rgb(0,0,255)";

	var max = 0;
	for (var i in dist) { if (dist[i] > max) max = dist[i]; }
	for (var i in dist) {
		current = Math.round((dist[i] / max) * IHEIGHT);
		i = parseInt(i);
		ctx.beginPath();
		ctx.moveTo(i, IHEIGHT + 1);
		ctx.lineTo(i, IHEIGHT - current);
		ctx.lineTo(i + 1, IHEIGHT - current);
		ctx.lineTo(i + 1, IHEIGHT + 1);
		ctx.closePath();
		ctx.fill();
	}
}

function mutate_gauss(dna_out) {
	CHANGED_SHAPE_INDEX = rand_int(dna_out.length - 1);

	var roulette = rand_float(2.0);

	// mutate color
	if (roulette < 1) {
		// red
		if (roulette < 0.25) {
			dna_out[CHANGED_SHAPE_INDEX].color.r = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.r);
		}
			// green
		else if (roulette < 0.5) {
			dna_out[CHANGED_SHAPE_INDEX].color.g = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.g);
		}
			// blue
		else if (roulette < 0.75) {
			dna_out[CHANGED_SHAPE_INDEX].color.b = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.b);
		}
			// alpha
		else if (roulette < 1.0) {
			dna_out[CHANGED_SHAPE_INDEX].color.a = 0.00390625 * rand_bell(255, Math.floor(dna_out[CHANGED_SHAPE_INDEX].color.a * 255));
		}
	}

		// mutate shape
	else {
		var CHANGED_POINT_INDEX = rand_int(dna_out[CHANGED_SHAPE_INDEX].shape.length - 1 - 1);

		// x-coordinate
		if (roulette < 1.5) {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_bell(IWIDTH, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x);
		}

			// y-coordinate
		else {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_bell(IHEIGHT, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y);
		}
	}
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function mutate_medium(dna_out, index) {
	var CHANGED_SHAPE_INDEX = index;

	var roulette = rand_float(2.0);

	// mutate color
	if (roulette < 1) {
		// red
		if (roulette < 0.25) {
			dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
		}
			// green
		else if (roulette < 0.5) {
			dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
		}
			// blue
		else if (roulette < 0.75) {
			dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
		}
			// alpha
		else if (roulette < 1.0) {
			dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
		}
	}

		// mutate shape
	else {
		var CHANGED_POINT_INDEX = rand_int(dna_out[CHANGED_SHAPE_INDEX].shape.length - 1 - 1);

		// x-coordinate
		if (roulette < 1.5) {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
		}

			// y-coordinate
		else {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
		}
	}
}

function mutate_hard(dna_out) {
	CHANGED_SHAPE_INDEX = rand_int(dna_out.length - 1);

	dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
	var CHANGED_POINT_INDEX = rand_int(dna_out.shape.length - 1);

	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
}

function mutate_soft(dna_out, index) {
	var CHANGED_SHAPE_INDEX = index;

	var roulette = rand_float(2.0);

	var delta = -1 + rand_int(3);

	// mutate color
	if (roulette < 1) {
		// red
		if (roulette < 0.25) {
			dna_out[CHANGED_SHAPE_INDEX].color.r = clamp(dna_out[CHANGED_SHAPE_INDEX].color.r + delta, 0, 255);
		}
			// green
		else if (roulette < 0.5) {
			dna_out[CHANGED_SHAPE_INDEX].color.g = clamp(dna_out[CHANGED_SHAPE_INDEX].color.g + delta, 0, 255);
		}
			// blue
		else if (roulette < 0.75) {
			dna_out[CHANGED_SHAPE_INDEX].color.b = clamp(dna_out[CHANGED_SHAPE_INDEX].color.b + delta, 0, 255);
		}
			// alpha
		else if (roulette < 1.0) {
			dna_out[CHANGED_SHAPE_INDEX].color.a = clamp(dna_out[CHANGED_SHAPE_INDEX].color.a + 0.1 * delta, 0.0, 1.0);
		}
	}

		// mutate shape
	else {
		var CHANGED_POINT_INDEX = rand_int(dna_out[CHANGED_SHAPE_INDEX].shape.length - 1);

		// x-coordinate
		if (roulette < 1.5) {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x + delta, 0, IWIDTH);
		}

			// y-coordinate
		else {
			dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y + delta, 0, IHEIGHT);
		}
	}
}

function compute_fitness(dna, callback) {
	var fitness = 0;
	draw_dna(CTX_TEST, dna, function () {
		DATA_TEST = CTX_TEST.getImageData(0, 0, IWIDTH, IHEIGHT).data;

		for (var i = 0; i < SUBPIXELS; ++i) {
			if (i % 4 != 3) {
				var dist = DATA_INPUT[i] - DATA_TEST[i];
				fitness += dist * dist;
			}
		}

		dna.fitness = fitness;
		callback(fitness);
	});
}
var mutate_rate = 0.3;
function dna_mutate(dna) {
	for(var i = 0; i < dna.length; i++){
		if(Math.random() > mutate_rate)
			continue;
		if(Math.random() > medium_rate)
			mutate_soft(dna, i);
		else
			mutate_medium(dna, i);
	}
	return dna;
}
var min = 9e99;
function compute_all_fitness(id, dnas, callback) {
	if (id >= dnas.length)
		return callback.call(this, dnas);
	compute_fitness(dnas[id], function (fitness) {
		dnas[id].fitness = fitness;
		compute_all_fitness(id + 1, dnas, callback);
	});
}
var medium_rate = 1;
function pre_reproduction(dnas, callback) {
	var i;
	var max = 0, sum = 0.0, gmin = 9e99;
	compute_all_fitness(0, dnas, function (ndnas) {
		for (i in ndnas) {
			if (ndnas[i].fitness < min) {
				min = ndnas[i].fitness;
				draw_dna(CTX_BEST, dnas[i]);
			}
			//if (ndnas[i].fitness < gmin) {
				//gmin = ndnas[i].fitness;
				//draw_dna(cgbest, dnas[i]);
			//}
			if (ndnas[i].fitness > max)
				max = ndnas[i].fitness;
		}
		for (i in ndnas) {
			var score = (max-ndnas[i].fitness)/(max-min);
			score *= score;
			ndnas[i].prob = score;
			sum += score;
		}
		for (i in ndnas)
			ndnas[i].prob /= sum;
		ndnas.sort(function (a, b) { return b.prob - a.prob; });
		for (i = 1; i < ndnas.length; i++)
			ndnas[i].prob += ndnas[i - 1].prob;
		document.getElementById("fitness").innerHTML = min;
		document.getElementById("fitness_p").innerHTML = min / maxd;
		mutate_rate = 0.1;//Math.sqrt(Math.sqrt(min / maxd));
		medium_rate = Math.sqrt(min/maxd);
		document.getElementById("mr").innerHTML = mutate_rate;
		document.getElementById("gmin").innerHTML = "mrate:"+medium_rate;
		document.getElementById("rrate").innerHTML = "rrate:"+rrate;
		callback.call(this, ndnas);
	});
}
function prob_select(dnas) {
	var prob = Math.random();
	var l = 0, r = dnas.length;
	while (l < r - 1) {
		var mid = (l + r) >> 1;
		if (dnas[mid].prob < prob)
			l = mid;
		else if (dnas[mid].prob > prob)
			r = mid;
		else {
			//console.log("selected:" + mid);
			return dnas[mid];
		}
	}
	//console.log("selected:" + l);
	return dnas[r];
}
function select_parents(dnas) {
	return {
		dna1: prob_select(dnas),
		dna2: prob_select(dnas)
	}
}
var gen = 0;
function reproduction(dnas) {
	//90% previous dnas die, replaced by their offsprings.
	pre_reproduction(dnas, function (ndnas) {
		var num = Math.floor(ndnas.length*0.1);
		if(num < 2)
			num = 2;
		var new_dnas = ndnas.slice(0, num);
		var count = (ndnas.length - new_dnas.length) / 2;
		while (count--) {
			var dnapair = select_parents(ndnas);
			dna_mutate(dnapair.dna1);
			dna_mutate(dnapair.dna2);
			var cdnapair = dna_cross(dnapair.dna1, dnapair.dna2);
			new_dnas.push(cdnapair.dna_out1);
			new_dnas.push(cdnapair.dna_out2);
		}
		document.getElementById("generation").innerHTML = ++gen;
		setTimeout(function () { reproduction(new_dnas); }, 0);
	});
}
var nop = 30;
function init_dna_one(w, h) {
	var i = nop;
	var dna = [];
	while (i--) {
		var v = 8;
		dna[nop - i - 1] = { shape: [], color: {} };
		while (v--)
			dna[nop - i - 1].shape[v] = { x: rand_int(w), y: rand_int(h) };
		dna[nop - i - 1].color = { r: rand_int(255), g: rand_int(255), b: rand_int(255), a: rand_int(255) };
	}
	return dna;
}
function init_dna(number, w, h) {
	var dna = [];
	//var templete = JSON.stringify(init_dna_one(w, h));
	while (number--) {
		//dna.push(dna_mutate(JSON.parse(templete)));
		dna.push(init_dna_one(w, h));
	}
	return dna;
}
var IWIDTH, IHEIGHT;
var maxd = 0;
function load_image(ev) {
	var file = ev.target.files[0];
	var image = new Image();
	var url = window.URL || window.webkitURL;
	var src = url.createObjectURL(file);
	image.src = src;
	image.onload = function () {
		IWIDTH = image.width;
		IHEIGHT = image.height;
		var dnas = init_dna(100, IWIDTH, IHEIGHT);
		var canvas = document.getElementById('canvas_input');
		CTX_INPUT = canvas.getContext('2d');
		canvas.setAttribute('width', IWIDTH);
		canvas.setAttribute('height', IHEIGHT);

		canvas = document.getElementById('canvas_test');
		CTX_TEST = canvas.getContext('2d');
		canvas.setAttribute('width', IWIDTH);
		canvas.setAttribute('height', IHEIGHT);

		canvas = document.getElementById('canvas_best');
		CTX_BEST = canvas.getContext('2d');
		canvas.setAttribute('width', IWIDTH);
		canvas.setAttribute('height', IHEIGHT);

		canvas = document.getElementById('canvas_gbest');
		cgbest = canvas.getContext('2d');
		canvas.setAttribute('width', IWIDTH);
		canvas.setAttribute('height', IHEIGHT);

		SUBPIXELS = IWIDTH * IHEIGHT * 4;

		// draw the image onto the canvas
		CTX_INPUT.drawImage(image, 0, 0, IWIDTH, IHEIGHT);

		DATA_INPUT = CTX_INPUT.getImageData(0, 0, IWIDTH, IHEIGHT).data;
		for (var i = 0; i < SUBPIXELS; ++i) {
			if (i % 4 != 3) {
				var dist = DATA_INPUT[i];
				if (dist < 128)
					dist = 255 - dist;
				maxd += dist * dist;
			}
		}
		min = maxd;
		reproduction(dnas);
	};
}
function init() {
	"use strict";
	document.getElementById("files").addEventListener('change', load_image, false);
}
