/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2013, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name Segment
 *
 * @class The Segment object represents the points of a path through which its
 * {@link Curve} objects pass. The segments of a path can be accessed through
 * its {@link Path#segments} array.
 *
 * Each segment consists of an anchor point ({@link Segment#point}) and
 * optionaly an incoming and an outgoing handle ({@link Segment#handleIn} and
 * {@link Segment#handleOut}), describing the tangents of the two {@link Curve}
 * objects that are connected by this segment.
 */
var Segment = this.Segment = Base.extend(/** @lends Segment# */{
	_class: 'Segment',

	/**
	 * Creates a new Segment object.
	 *
	 * @name Segment#initialize
	 * @param {Point} [point={x: 0, y: 0}] the anchor point of the segment
	 * @param {Point} [handleIn={x: 0, y: 0}] the handle point relative to the
	 *        anchor point of the segment that describes the in tangent of the
	 *        segment.
	 * @param {Point} [handleOut={x: 0, y: 0}] the handle point relative to the
	 *        anchor point of the segment that describes the out tangent of the
	 *        segment.
	 *
	 * @example {@paperscript}
	 * var handleIn = new Point(-80, -100);
	 * var handleOut = new Point(80, 100);
	 *
	 * var firstPoint = new Point(100, 50);
	 * var firstSegment = new Segment(firstPoint, null, handleOut);
	 *
	 * var secondPoint = new Point(300, 50);
	 * var secondSegment = new Segment(secondPoint, handleIn, null);
	 *
	 * var path = new Path(firstSegment, secondSegment);
	 * path.strokeColor = 'black';
	 */
	/**
	 * Creates a new Segment object.
	 *
	 * @name Segment#initialize
	 * @param {Object} properties An object literal containing properties to
	 * be set on the segment.
	 *
	 * @example {@paperscript}
	 * var firstSegment = new Segment({
	 * 	point: [100, 50],
	 * 	handleOut: [80, 100]
	 * });
	 * 
	 * var secondSegment = new Segment({
	 * 	point: [300, 50],
	 * 	handleIn: [-80, -100]
	 * });
	 * 
	 * var path = new Path({
	 * 	segments: [firstSegment, secondSegment],
	 * 	strokeColor: 'black'
	 * });
	 */
	/**
	 * Creates a new Segment object.
	 *
	 * @param {Number} x the x coordinate of the segment point
	 * @param {Number} y the y coordinate of the segment point
	 * @param {Number} inX the x coordinate of the the handle point relative
	 * 	      to the anchor point of the segment that describes the in tangent
	 *        of the segment.
	 * @param {Number} inY the y coordinate of the the handle point relative
	 * 	      to the anchor point of the segment that describes the in tangent
	 *        of the segment.
	 * @param {Number} outX the x coordinate of the the handle point relative
	 * 	      to the anchor point of the segment that describes the out tangent
	 *        of the segment.
	 * @param {Number} outY the y coordinate of the the handle point relative
	 * 	      to the anchor point of the segment that describes the out tangent
	 *        of the segment.
	 *
	 * @example {@paperscript}
	 * var inX = -80;
	 * var inY = -100;
	 * var outX = 80;
	 * var outY = 100;
	 * 
	 * var x = 100;
	 * var y = 50;
	 * var firstSegment = new Segment(x, y, inX, inY, outX, outY);
	 * 
	 * var x2 = 300;
	 * var y2 = 50;
	 * var secondSegment = new Segment( x2, y2, inX, inY, outX, outY);
	 * 
	 * var path = new Path(firstSegment, secondSegment);
	 * path.strokeColor = 'black';
	 * @ignore
	 */
	initialize: function(arg0, arg1, arg2, arg3, arg4, arg5) {
		var count = arguments.length,
			createPoint = SegmentPoint.create,
			point, handleIn, handleOut;
		// TODO: Use Point.read or Point.readNamed to read these?
		if (count == 0) {
			// Nothing
		} else if (count == 1) {
			// Note: This copies from existing segments through bean getters
			if (arg0.point) {
				point = arg0.point;
				handleIn = arg0.handleIn;
				handleOut = arg0.handleOut;
			} else {
				point = arg0;
			}
		} else if (count < 6) {
			if (count == 2 && arg1.x === undefined) {
				point = [ arg0, arg1 ];
			} else {
				point = arg0;
				// Doesn't matter if these arguments exist, SegmentPointcreate
				// produces creates points with (0, 0) otherwise
				handleIn = arg1;
				handleOut = arg2;
			}
		} else if (count == 6) {
			point = [ arg0, arg1 ];
			handleIn = [ arg2, arg3 ];
			handleOut = [ arg4, arg5 ];
		}
		createPoint(this, '_point', point);
		createPoint(this, '_handleIn', handleIn);
		createPoint(this, '_handleOut', handleOut);
	},

	_serialize: function(options) {
		return Base.serialize(this._handleIn.isZero() && this._handleOut.isZero()
				? this._point
				: [this._point, this._handleIn, this._handleOut], options, true);
	},

	_changed: function(point) {
		if (!this._path)
			return;
		// Delegate changes to affected curves if they exist. Check _curves
		// first to make sure we're not creating it by calling this.getCurve().
		var curve = this._path._curves && this.getCurve(),
			other;
		if (curve) {
			curve._changed();
			// Get the other affected curve, which is the previous one for
			// _point or _handleIn changing when this segment is _segment1 of
			// the curve, for all other cases it's the next (e.g. _handleOut
			// when this segment is _segment2)
			if (other = (curve[point == this._point
					|| point == this._handleIn && curve._segment1 == this
					? 'getPrevious' : 'getNext']())) {
				other._changed();
			}
		}
		this._path._changed(/*#=*/ Change.GEOMETRY);
	},

	/**
	 * The anchor point of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getPoint: function() {
		return this._point;
	},

	setPoint: function(point) {
		point = Point.read(arguments);
		// Do not replace the internal object but update it instead, so
		// references to it are kept alive.
		this._point.set(point.x, point.y);
	},

	/**
	 * The handle point relative to the anchor point of the segment that
	 * describes the in tangent of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getHandleIn: function() {
		return this._handleIn;
	},

	setHandleIn: function(point) {
		point = Point.read(arguments);
		// See #setPoint:
		this._handleIn.set(point.x, point.y);
		// Update corner accordingly
		// this.corner = !this._handleIn.isColinear(this._handleOut);
	},

	/**
	 * The handle point relative to the anchor point of the segment that
	 * describes the out tangent of the segment.
	 *
	 * @type Point
	 * @bean
	 */
	getHandleOut: function() {
		return this._handleOut;
	},

	setHandleOut: function(point) {
		point = Point.read(arguments);
		// See #setPoint:
		this._handleOut.set(point.x, point.y);
		// Update corner accordingly
		// this.corner = !this._handleIn.isColinear(this._handleOut);
	},

	/**
	 * Specifies whether the segment has no handles defined, meaning it connects
	 * two straight lines.
	 *
	 * @type Point
	 * @bean
	 */
	isLinear: function() {
		return this._handleIn.isZero() && this._handleOut.isZero();
	},

	setLinear: function() {
		this._handleIn.set(0, 0);
		this._handleOut.set(0, 0);
	},

	_isSelected: function(point) {
		var state = this._selectionState;
		return point == this._point ? !!(state & /*#=*/ SelectionState.POINT)
			: point == this._handleIn ? !!(state & /*#=*/ SelectionState.HANDLE_IN)
			: point == this._handleOut ? !!(state & /*#=*/ SelectionState.HANDLE_OUT)
			: false;
	},

	_setSelected: function(point, selected) {
		var path = this._path,
			selected = !!selected, // convert to boolean
			state = this._selectionState || 0,
			// For performance reasons use array indices to access the various
			// selection states: 0 = point, 1 = handleIn, 2 = handleOut
			selection = [
				!!(state & /*#=*/ SelectionState.POINT),
				!!(state & /*#=*/ SelectionState.HANDLE_IN),
				!!(state & /*#=*/ SelectionState.HANDLE_OUT)
			];
		if (point == this._point) {
			if (selected) {
				// We're selecting point, deselect the handles
				selection[1] = selection[2] = false;
			} else {
				var previous = this.getPrevious(),
					next = this.getNext();
				// When deselecting a point, the handles get selected instead
				// depending on the selection state of their neighbors.
				selection[1] = previous && (previous._point.isSelected()
						|| previous._handleOut.isSelected());
				selection[2] = next && (next._point.isSelected()
						|| next._handleIn.isSelected());
			}
			selection[0] = selected;
		} else {
			var index = point == this._handleIn ? 1 : 2;
			if (selection[index] != selected) {
				// When selecting handles, the point get deselected.
				if (selected)
					selection[0] = false;
				selection[index] = selected;
			}
		}
		this._selectionState = (selection[0] ? /*#=*/ SelectionState.POINT : 0)
				| (selection[1] ? /*#=*/ SelectionState.HANDLE_IN : 0)
				| (selection[2] ? /*#=*/ SelectionState.HANDLE_OUT : 0);
		// If the selection state of the segment has changed, we need to let
		// it's path know and possibly add or remove it from
		// project._selectedItems
		if (path && state != this._selectionState) {
			path._updateSelection(this, state, this._selectionState);
			// Let path know that we changed something and the view should be
			// redrawn
			path._changed(/*#=*/ Change.ATTRIBUTE);
		}
	},



	/**
	 * Specifies whether the {@link #point} of the segment is selected.
	 * @type Boolean
	 * @bean
	 * @example {@paperscript}
	 * var path = new Path.Circle({
	 * 	center: [80, 50],
	 * 	radius: 40
	 * });
	 * 
	 * // Select the third segment point:
	 * path.segments[2].selected = true;
	 */
	isSelected: function() {
		return this._isSelected(this._point);
	},

	setSelected: function(selected) {
		this._setSelected(this._point, selected);
	},

	/**
	 * {@grouptitle Hierarchy}
	 *
	 * The index of the segment in the {@link Path#segments} array that the
	 * segment belongs to.
	 *
	 * @type Number
	 * @bean
	 */
	getIndex: function() {
		return this._index !== undefined ? this._index : null;
	},

	/**
	 * The path that the segment belongs to.
	 *
	 * @type Path
	 * @bean
	 */
	getPath: function() {
		return this._path || null;
	},

	/**
	 * The curve that the segment belongs to.
	 *
	 * @type Curve
	 * @bean
	 */
	getCurve: function() {
		if (this._path) {
			var index = this._index;
			// The last segment of an open path belongs to the last curve
			if (!this._path._closed && index == this._path._segments.length - 1)
				index--;
			return this._path.getCurves()[index] || null;
		}
		return null;
	},

	/**
	 * {@grouptitle Sibling Segments}
	 *
	 * The next segment in the {@link Path#segments} array that the segment
	 * belongs to. If the segments belongs to a closed path, the first segment
	 * is returned for the last segment of the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getNext: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index + 1]
				|| this._path._closed && segments[0]) || null;
	},

	/**
	 * The previous segment in the {@link Path#segments} array that the
	 * segment belongs to. If the segments belongs to a closed path, the last
	 * segment is returned for the first segment of the path.
	 *
	 * @type Segment
	 * @bean
	 */
	getPrevious: function() {
		var segments = this._path && this._path._segments;
		return segments && (segments[this._index - 1]
				|| this._path._closed && segments[segments.length - 1]) || null;
	},

	/**
	 * Returns the reversed the segment, without modifying the segment itself.
	 * @return {Segment} the reversed segment
	 */
	reverse: function() {
		return new Segment(this._point, this._handleOut, this._handleIn);
	},

	/**
	 * Removes the segment from the path that it belongs to.
	 */
	remove: function() {
		return this._path ? !!this._path.removeSegment(this._index) : false;
	},

	clone: function() {
		return new Segment(this._point, this._handleIn, this._handleOut);
	},

	equals: function(segment) {
		return segment == this || segment
				&& this._point.equals(segment._point)
				&& this._handleIn.equals(segment._handleIn)
				&& this._handleOut.equals(segment._handleOut);
	},

	/**
	 * @return {String} A string representation of the segment.
	 */
	toString: function() {
		var parts = [ 'point: ' + this._point ];
		if (!this._handleIn.isZero())
			parts.push('handleIn: ' + this._handleIn);
		if (!this._handleOut.isZero())
			parts.push('handleOut: ' + this._handleOut);
		return '{ ' + parts.join(', ') + ' }';
	},

	_transformCoordinates: function(matrix, coords, change) {
		// Use matrix.transform version() that takes arrays of multiple
		// points for largely improved performance, as no calls to
		// Point.read() and Point constructors are necessary.
		var point = this._point,
			// If change is true, only transform handles if they are set, as
			// _transformCoordinates is called only to change the segment, no
			// to receive the coords.
			// This saves some computation time. If change is false, always
			// use the real handles, as we just want to receive a filled
			// coords array for getBounds().
			handleIn =  !change || !this._handleIn.isZero()
					? this._handleIn : null,
			handleOut = !change || !this._handleOut.isZero()
					? this._handleOut : null,
			x = point._x,
			y = point._y,
			i = 2;
		coords[0] = x;
		coords[1] = y;
		// We need to convert handles to absolute coordinates in order
		// to transform them.
		if (handleIn) {
			coords[i++] = handleIn._x + x;
			coords[i++] = handleIn._y + y;
		}
		if (handleOut) {
			coords[i++] = handleOut._x + x;
			coords[i++] = handleOut._y + y;
		}
		// If no matrix was previded, this was just called to get the coords and
		// we are done now.
		if (matrix) {
			matrix._transformCoordinates(coords, 0, coords, 0, i / 2);
			x = coords[0];
			y = coords[1];
			if (change) {
				// If change is true, we need to set the new values back
				point._x = x;
				point._y = y;
				i  = 2;
				if (handleIn) {
					handleIn._x = coords[i++] - x;
					handleIn._y = coords[i++] - y;
				}
				if (handleOut) {
					handleOut._x = coords[i++] - x;
					handleOut._y = coords[i++] - y;
				}
			} else {
				// We want to receive the results in coords, so make sure
				// handleIn and out are defined too, even if they're 0
				if (!handleIn) {
					coords[i++] = x;
					coords[i++] = y;
				}
				if (!handleOut) {
					coords[i++] = x;
					coords[i++] = y;
				}
			}
		}
		return coords;
		// NOTE: There is a very strange bug in JavaScriptCore that causes
		// segments to receive wrong handleIn values after the transformation of
		// a very large amount of segments.
		// For some strange reason, this unreachable stamement causes
		// JavaScriptCore to optimize code differently and not cause the error.
		// Note that there is no nop() function...
		nop().nop();
	}
});
