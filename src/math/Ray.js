import { Vector3 } from './Vector3.js';

const v1 = new Vector3();
const edge1 = new Vector3();
const edge2 = new Vector3();
const normal = new Vector3();

/**
* Class representing a ray in 3D space.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Ray {

	/**
	* Constructs a new ray with the given values.
	*
	* @param {Vector3} origin - The origin of the ray.
	* @param {Vector3} direction - The direction of the ray.
	*/
	constructor( origin = new Vector3(), direction = new Vector3() ) {

		/**
		* The origin of the ray.
		* @type Vector3
		*/
		this.origin = origin;

		/**
		* The direction of the ray.
		* @type Vector3
		*/
		this.direction = direction;

	}

	/**
	* Sets the given values to this ray.
	*
	* @param {Vector3} origin - The origin of the ray.
	* @param {Vector3} direction - The direction of the ray.
	* @return {Ray} A reference to this ray.
	*/
	set( origin, direction ) {

		this.origin = origin;
		this.direction = direction;

		return this;

	}

	/**
	* Copies all values from the given ray to this ray.
	*
	* @param {Ray} ray - The ray to copy.
	* @return {Ray} A reference to this ray.
	*/
	copy( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

	}

	/**
	* Creates a new ray and copies all values from this ray.
	*
	* @return {Ray} A new ray.
	*/
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	* Computes a position on the ray according to the given t value
	* and stores the result in the given 3D vector. The t value has a range of
	* [0, Infinity] where 0 means the position is equal with the origin of the ray.
	*
	* @param {Number} t - A scalar value representing a position on the ray.
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	at( t, result ) {

		// t has to be zero or positive
		return result.copy( this.direction ).multiplyScalar( t ).add( this.origin );

	}

	/**
	* Performs a ray/sphere intersection test and stores the intersection point
	* to the given 3D vector. If no intersection is detected, *null* is returned.
	*
	* @param {BoundingSphere} sphere - A bounding sphere.
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	intersectBoundingSphere( sphere, result ) {

		v1.subVectors( sphere.center, this.origin );
		const tca = v1.dot( this.direction );
		const d2 = v1.dot( v1 ) - tca * tca;
		const radius2 = sphere.radius * sphere.radius;

		if ( d2 > radius2 ) return null;

		const thc = Math.sqrt( radius2 - d2 );

		// t0 = first intersect point - entrance on front of sphere

		const t0 = tca - thc;

		// t1 = second intersect point - exit point on back of sphere

		const t1 = tca + thc;

		// test to see if both t0 and t1 are behind the ray - if so, return null

		if ( t0 < 0 && t1 < 0 ) return null;

		// test to see if t0 is behind the ray:
		// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
		// in order to always return an intersect point that is in front of the ray.

		if ( t0 < 0 ) return this.at( t1, result );

		// else t0 is in front of the ray, so return the first collision point scaled by t0

		return this.at( t0, result );

	}

	/**
	* Performs a ray/AABB intersection test and stores the intersection point
	* to the given 3D vector. If no intersection is detected, *null* is returned.
	*
	* @param {BoundingSphere} sphere - A bounding sphere.
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	intersectAABB( aabb, result ) {

		let tmin, tmax, tymin, tymax, tzmin, tzmax;

		const invdirx = 1 / this.direction.x,
			invdiry = 1 / this.direction.y,
			invdirz = 1 / this.direction.z;

		const origin = this.origin;

		if ( invdirx >= 0 ) {

			tmin = ( aabb.min.x - origin.x ) * invdirx;
			tmax = ( aabb.max.x - origin.x ) * invdirx;

		} else {

			tmin = ( aabb.max.x - origin.x ) * invdirx;
			tmax = ( aabb.min.x - origin.x ) * invdirx;

		}

		if ( invdiry >= 0 ) {

			tymin = ( aabb.min.y - origin.y ) * invdiry;
			tymax = ( aabb.max.y - origin.y ) * invdiry;

		} else {

			tymin = ( aabb.max.y - origin.y ) * invdiry;
			tymax = ( aabb.min.y - origin.y ) * invdiry;

		}

		if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

		// these lines also handle the case where tmin or tmax is NaN
		// (result of 0 * Infinity). x !== x returns true if x is NaN

		if ( tymin > tmin || tmin !== tmin ) tmin = tymin;

		if ( tymax < tmax || tmax !== tmax ) tmax = tymax;

		if ( invdirz >= 0 ) {

			tzmin = ( aabb.min.z - origin.z ) * invdirz;
			tzmax = ( aabb.max.z - origin.z ) * invdirz;

		} else {

			tzmin = ( aabb.max.z - origin.z ) * invdirz;
			tzmax = ( aabb.min.z - origin.z ) * invdirz;

		}

		if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

		if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		// return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, result );

	}

	/**
	* Performs a ray/triangle intersection test and stores the intersection point
	* to the given 3D vector. If no intersection is detected, *null* is returned.
	*
	* @param {Triangle} triangle - A triangle.
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	intersectTriangle( triangle, backfaceCulling, result ) {

		// reference: https://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

		const a = triangle.a;
		const b = triangle.b;
		const c = triangle.c;

		edge1.subVectors( b, a );
		edge2.subVectors( c, a );
		normal.crossVectors( edge1, edge2 );

		let DdN = this.direction.dot( normal );
		let sign;

		if ( DdN > 0 ) {

			if ( backfaceCulling ) return null;
			sign = 1;

		} else if ( DdN < 0 ) {

			sign = - 1;
			DdN = - DdN;

		} else {

			return null;

		}

		v1.subVectors( this.origin, a );
		const DdQxE2 = sign * this.direction.dot( edge2.crossVectors( v1, edge2 ) );

		// b1 < 0, no intersection

		if ( DdQxE2 < 0 ) {

			return null;

		}

		const DdE1xQ = sign * this.direction.dot( edge1.cross( v1 ) );

		// b2 < 0, no intersection

		if ( DdE1xQ < 0 ) {

			return null;

		}

		// b1 + b2 > 1, no intersection

		if ( DdQxE2 + DdE1xQ > DdN ) {

			return null;

		}

		// line intersects triangle, check if ray does

		const QdN = - sign * v1.dot( normal );

		// t < 0, no intersection

		if ( QdN < 0 ) {

			return null;

		}

		// ray intersects triangle

		return this.at( QdN / DdN, result );

	}

	/**
	* Transforms this ray by the given 4x4 matrix.
	*
	* @param {Matrix4} m - The 4x4 matrix.
	* @return {Ray} A reference to this ray.
	*/
	applyMatrix4( m ) {

		this.origin.applyMatrix4( m );
		this.direction.transformDirection( m );

		return this;

	}

	/**
	* Returns true if the given ray is deep equal with this ray.
	*
	* @param {Ray} ray - The ray to test.
	* @return {Boolean} The result of the equality test.
	*/
	equals( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

	}

}

export { Ray };
