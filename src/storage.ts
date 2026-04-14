import { createDisk, type Disk } from '@minimajs/disk';
import { config } from './config';

const disks: Record<string, Disk> = {}

export const upload = async (driver: string = 'local', file: File, path: string = '') => {
	disks[driver] = disks[driver] || createDisk({driver: config!.storage[driver]});

	path = path.replace(/^\//, '').replace(/\/$/, '') + '/' + file.name;

	const res = await disks[driver].put(path, file)
	const url = (await disks[driver].url(path)).replace(/\/\//g, '/');

	return {
		driver,
		path,
		filename: res.name,
		type: res.type,
		size: file.size,
		url
	}
}

export const remove = (driver: string, path: string) => {
	disks[driver] = disks[driver] || createDisk({driver: config!.storage[driver]});
	const disk = disks[driver];

	return disk.delete(path);
}
