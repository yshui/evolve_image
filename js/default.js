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

function draw_dna(ctx, dna) {
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
	for (var i in dna) {
		drawShape(ctx, dna[i].shape, dna[i].color);
	}
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

function dna_cross(dna1, dna2) {
	if (dna1.length != dna2.length)
		return;
	var a = rand_int(dna1.length - 1);
	var b = rand_int(dna1.length - 1);
	return {
		dna_out1: dna1.slice(0, a).concat(dna2.slice(a, b).concat(dna1.slice(b, dna1.length))),
		dna_out2: dna2.slice(0, a).concat(dna1.slice(a, b).concat(dna2.slice(b, dna1.length)))
	};
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
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);

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
		var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);

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
function mutate_medium(dna_out) {
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);

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
		var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);

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
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);

	dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
	dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
	var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);

	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
	dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
}

function mutate_soft(dna_out) {
	CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES - 1);

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
		var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS - 1);

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

function compute_fitness(dna) {
	var fitness = 0;

	DATA_TEST = CTX_TEST.getImageData(0, 0, IWIDTH, IHEIGHT).data;

	for (var i = 0; i < SUBPIXELS; ++i) {
		if (i % DEPTH != 3) {
			var dist = DATA_INPUT[i] - DATA_TEST[i];
			fitness += dist * dist;
		}
	}

	return fitness;
}
var mutate_rate = 0.1;
function dna_mutate(dna) {
	if (Math.random(1.0) > mutata_rate)
		return;
	mutate_medium(dna)
}
var max = 0;
function pre_reproduction(dnas) {
	var i;
	var min = 9e99, sum = 0.0;
	for (i in dnas) {
		dnas[i].fitness = compute_fitness(dnas[i]);
		if (dnas[i].fitness < min)
			min = dnas[i].fitness;
		if (dnas[i].fitness > max) {
			max = dnas[i].fitness;
			draw_dna(CTX_BEST, dnas[i]);
		}
		sum += dnas[i].fitness;
	}
	sum -= dnas.length * min;
	for (i in dnas) {
		dnas[i].fitness = (dnas[i].fitness - min) / sum;
		if (i > 0)
			dnas[i].fitness += dnas[i - 1].fitness;
	}
}
function prob_select(dnas) {
	var prob = Math.random(1.0);
	var l = 0, r = dnas.length;
	while (l < r - 1) {
		var mid = (l + r) >> 1;
		if (dnas[mid] < prob)
			l = mid;
		else if (dnas[mid] > prob)
			r = mid;
		else return dnas[mid];
	}
	return dnas[l];
}
function select_parents(dnas) {
	return {
		dna1: prob_select(dnas),
		dna2: prob_select(dnas)
	}
}
function reproduction(dnas) {
	//80% previous dnas die, replaced by their offsprings.
	var new_dnas = dnas.slice(0, Math.floor(dnas.length * 0.8));
	var count = (dnas.length - new_dnas.length) / 2;
	while (count--) {
		var dnapair = select_parents(dnas);
		dnapair = dna_cross(dnapair.dna1, dnapair.dna2);
		dna_mutate(dnapair.dna_out1);
		dna_mutate(dnapair.dna_out2);
		new_dnas.push(dnapair.dna_out1);
		new_dnas.push(dnapair.dna_out2);
	}
}
(function () {
	"use strict";
	var dnas = init_dna(2000);
	var IMAGE = new Image();
	IMAGE.src = "file:///D:/a.jpg";
	IWIDTH = IMAGE.width;
	IHEIGHT = IMAGE.height;
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

	SUBPIXELS = IWIDTH * IHEIGHT * DEPTH;
	NORM_COEF = IWIDTH * IHEIGHT * 3 * 255;

	// draw the image onto the canvas
	CTX_INPUT.drawImage(IMAGE, 0, 0, IWIDTH, IHEIGHT);

	DATA_INPUT = CTX_INPUT.getImageData(0, 0, IWIDTH, IHEIGHT).data;

	setInterval(function () { reproduction(dnas); }, 0);
})();
