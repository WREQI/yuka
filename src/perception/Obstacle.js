import { GameEntity } from '../core/GameEntity.js';
import { MeshGeometry } from '../core/MeshGeometry.js';
import { AABB } from '../math/AABB.js';
import { Vector3 } from '../math/Vector3.js';

const aabb = new AABB();
const triangle = { a: new Vector3(), b: new Vector3(), c: new Vector3() };
const intersectionPointAABB = new Vector3();

/**
* Class for representing an obstacle in 3D space.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @augments GameEntity
*/
class Obstacle extends GameEntity {

	/**
	* Constructs a new obstacle.
	*
	* @param {MeshGeometry} geometry - A geometry representing a mesh.
	*/
	constructor( geometry = new MeshGeometry() ) {

		super();

		this.geometry = geometry;

	}

	/**
	* Performs a ray intersection test with the geometry of the obstacle and stores
	* the intersection point in the given result vector. If no intersection is detected,
	* *null* is returned.
	*
	* @param {Ray} ray - The ray to test.
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	intersectRay( ray, result ) {

		const geometry = this.geometry;

		// check bounding volume first

		aabb.copy( geometry.aabb ).applyMatrix4( this.worldMatrix );

		if ( ray.intersectAABB( aabb, intersectionPointAABB ) !== null ) {

			// now perform more expensive test with all triangles of the geometry

			const vertices = geometry.vertices;
			const indices = geometry.indices;

			if ( indices === null ) {

				// non-indexed geometry

				for ( let i = 0, l = vertices.length; i < l; i += 9 ) {

					triangle.a.set( vertices[ i ], vertices[ i + 1 ], vertices[ i + 2 ] );
					triangle.b.set( vertices[ i + 3 ], vertices[ i + 4 ], vertices[ i + 5 ] );
					triangle.c.set( vertices[ i + 6 ], vertices[ i + 7 ], vertices[ i + 8 ] );

					triangle.a.applyMatrix4( this.worldMatrix );
					triangle.b.applyMatrix4( this.worldMatrix );
					triangle.c.applyMatrix4( this.worldMatrix );

					if ( ray.intersectTriangle( triangle, geometry.backfaceCulling, result ) !== null ) {

						return result;

					}

				}

			} else {

				// indexed geometry

				for ( let i = 0, l = indices.length; i < l; i += 3 ) {

					const a = indices[ i ];
					const b = indices[ i + 1 ];
					const c = indices[ i + 2 ];

					const stride = 3;

					triangle.a.set( vertices[ ( a * stride ) ], vertices[ ( a * stride ) + 1 ], vertices[ ( a * stride ) + 2 ] );
					triangle.b.set( vertices[ ( b * stride ) ], vertices[ ( b * stride ) + 1 ], vertices[ ( b * stride ) + 2 ] );
					triangle.c.set( vertices[ ( c * stride ) ], vertices[ ( c * stride ) + 1 ], vertices[ ( c * stride ) + 2 ] );

					triangle.a.applyMatrix4( this.worldMatrix );
					triangle.b.applyMatrix4( this.worldMatrix );
					triangle.c.applyMatrix4( this.worldMatrix );

					if ( ray.intersectTriangle( triangle, geometry.backfaceCulling, result ) !== null ) {

						return result;

					}

				}

			}

		}

		return null;

	}

}

export { Obstacle };