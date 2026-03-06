import { Server } from 'socket.io'

// Map userId -> Set of socketIds
const userIdToSocketIds = new Map()
export let ioInstance = null

// Helper to normalize IDs (handle objects, strings, ObjectIds)
const normalizeId = (id) => {
	if (!id) return null;
	if (typeof id === 'object' && id._id) return String(id._id);
	return String(id);
};

export default function setupSocket(server) {
	const io = new Server(server, {
		path: '/api/socket.io',
		cors: {
			origin: ["https://dreamcrms.vercel.app", "https://dreamcrm.onrender.com", "https://crm.cdcinternational.in", "http://localhost:5173", "http://localhost:5174"],
			credentials: true
		}
	})

	ioInstance = io
	console.log('✅ Socket.io initialized on /api/socket.io')

	io.on('connection', (socket) => {
		let currentUserId = null

		// Client should emit 'register' right after connect
		socket.on('register', ({ userId, fullName, isAdmin, roles, assignedBrands }) => {
			try {
				if (!userId) {
					console.warn('Socket registration attempt without userId');
					return;
				}
				const uid = normalizeId(userId);
				const isFirstConnection = !userIdToSocketIds.has(uid)
				currentUserId = uid

				const set = userIdToSocketIds.get(uid) || new Set()
				set.add(socket.id)
				userIdToSocketIds.set(uid, set)

				if (isFirstConnection) {
					io.emit('user:online', { userId: uid, fullName })
				}

				// Join a personal room per user
				socket.join(`user:${currentUserId}`)

				// Join Admin room (Owners/Admins see everything)
				const isGlobalAdmin = isAdmin === true;

				if (isGlobalAdmin) {
					socket.join('room:admin')
				}

				// Join Brand rooms
				if (assignedBrands && Array.isArray(assignedBrands)) {
					assignedBrands.forEach(brand => {
						const bId = normalizeId(brand);
						if (bId) {
							socket.join(`brand:${bId}`)
						}
					})
				}

				// Add a join:brand listener for dynamic brand switching
				socket.on('join:brand', (brandId) => {
					const bId = normalizeId(brandId);
					if (bId) {
						socket.join(`brand:${bId}`);
					}
				});

				socket.emit('registered', { ok: true })
			} catch (e) {
				console.error('Error registering socket:', e)
			}
		})

		socket.on('disconnect', () => {
			if (!currentUserId) return
			const set = userIdToSocketIds.get(currentUserId)
			if (set) {
				set.delete(socket.id)
				if (set.size === 0) {
					userIdToSocketIds.delete(currentUserId)
					ioInstance.emit('user:offline', { userId: currentUserId })
				}
			}
		})
	})

	return io
}

// Export function to emit generic notifications
export function emitNotification({ recipients, brandId, notification }) {
	if (!ioInstance) {
		console.warn('[Socket] emitNotification called before ioInstance initialized');
		return;
	}

	// 1. Notify specific users (e.g. Assignees)
	if (recipients && Array.isArray(recipients)) {
		recipients.forEach(userId => {
			const uid = normalizeId(userId);
			if (uid) {
				ioInstance.to(`user:${uid}`).emit('notification', { ...notification, brandId })
			}
		})
	}

	// 2. Notify Admins/Owners (Global)
	ioInstance.to('room:admin').emit('notification', { ...notification, brandId })

	// 3. Notify Brand Managers (Scoped)
	if (brandId) {
		const bId = normalizeId(brandId);
		if (bId) {
			ioInstance.to(`brand:${bId}`).emit('notification', { ...notification, brandId })
		}
	}
}

export function emitLabUpdate({ labId, brandIds, type, data }) {
	if (!ioInstance) return;

	const payload = { labId, type, data, timestamp: new Date() };

	// 1. Notify specific brand rooms if provided
	if (brandIds && Array.isArray(brandIds)) {
		brandIds.forEach(brandId => {
			const bId = normalizeId(brandId);
			if (bId) {
				ioInstance.to(`brand:${bId}`).emit('lab:update', payload);
			}
		});
	}

	// 2. Also notify general admin room
	ioInstance.to('room:admin').emit('lab:update', payload);
}

export function emitImmediateFollowup({ recipients, brandId, customer }) {
	if (!ioInstance) {
		console.warn('[Socket] emitImmediateFollowup called before ioInstance initialized');
		return;
	}

	const bIdStr = normalizeId(brandId);

	const payload = {
		customer: {
			_id: String(customer._id),
			fullName: customer.fullName,
			phone1: customer.phone1,
			immediateFollowupAt: customer.immediateFollowupAt,
			leadStatus: customer.leadStatus,
			leadPotential: customer.leadPotential
		},
		brandId: bIdStr,
		timestamp: new Date()
	};

	// 1. Notify specific users
	if (recipients && Array.isArray(recipients)) {
		recipients.forEach(userId => {
			const uid = normalizeId(userId);
			if (uid) {
				ioInstance.to(`user:${uid}`).emit('immediate:followup', payload);
			}
		});
	}

	// 2. Notify Brand Managers/Admins
	if (bIdStr) {
		ioInstance.to(`brand:${bIdStr}`).emit('immediate:followup', payload);
	}

	// 3. Notify Global Admins
	ioInstance.to('room:admin').emit('immediate:followup', payload);
}

export function getOnlineUsers() {
	return Array.from(userIdToSocketIds.keys());
}
