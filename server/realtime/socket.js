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
				// Exclude Brand Manager from global room so they only see their brand's notifications
				const isGlobalAdmin = isAdmin === true ||
					(Array.isArray(roles) && (roles.includes('Owner') || roles.includes('Admin'))) ||
					roles === 'Owner' || roles === 'Admin';

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
				ioInstance.to(`user:${uid}`).emit('notification', notification)
			}
		})
	}

	// 2. Notify Admins/Owners (Global)
	ioInstance.to('room:admin').emit('notification', notification)

	// 3. Notify Brand Managers (Scoped)
	if (brandId) {
		const bId = normalizeId(brandId);
		if (bId) {
			ioInstance.to(`brand:${bId}`).emit('notification', notification)
		}
	}
}

export function getOnlineUsers() {
	return Array.from(userIdToSocketIds.keys());
}
