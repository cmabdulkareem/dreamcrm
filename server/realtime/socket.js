import { Server } from 'socket.io'

// Map userId -> Set of socketIds
const userIdToSocketIds = new Map()
let ioInstance = null

export default function setupSocket(server) {
	const io = new Server(server, {
		cors: {
			origin: true, // reflect request origin
			credentials: true
		}
	})

	ioInstance = io

	io.on('connection', (socket) => {
		let currentUserId = null

		// Client should emit 'register' right after connect
		socket.on('register', ({ userId, fullName, isAdmin, roles, assignedBrands }) => {
			try {
				currentUserId = String(userId)
				const set = userIdToSocketIds.get(currentUserId) || new Set()
				set.add(socket.id)
				userIdToSocketIds.set(currentUserId, set)

				// Join a personal room per user
				socket.join(`user:${currentUserId}`)

				// Join Admin room
				if (isAdmin || roles?.includes('Owner') || roles?.includes('Admin')) {
					socket.join('room:admin')
				}

				// Join Brand rooms (for Managers/Admins)
				if (assignedBrands && Array.isArray(assignedBrands)) {
					assignedBrands.forEach(brand => {
						const brandId = typeof brand === 'object' ? brand._id : brand
						if (brandId) {
							socket.join(`brand:${String(brandId)}`)
						}
					})
				}

				// Optionally acknowledge
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
				}
			}
		})


	})

	return io
}

// Export function to emit generic notifications
export function emitNotification({ recipients, brandId, notification }) {
	if (!ioInstance) return

	// 1. Notify specific users (e.g. Faculties)
	if (recipients && recipients.length > 0) {
		recipients.forEach(userId => {
			ioInstance.to(`user:${String(userId)}`).emit('notification', notification)
		})
	}

	// 2. Notify Admins (Global)
	ioInstance.to('room:admin').emit('notification', notification)

	// 3. Notify Brand Managers (Scoped)
	if (brandId) {
		ioInstance.to(`brand:${String(brandId)}`).emit('notification', notification)
	}
}


