import redis from 'redis';
import { promisify } from 'util';

const client = redis.createClient(process.env.REDIS_URL);
const getAsync = promisify(client.get).bind(client);

export const cache = (key, ttl = 3600) => {
    return async (req, res, next) => {
        try {
            const cachedData = await getAsync(key);

            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }

            // Guardar referencia a la función original de res.json
            const originalJson = res.json;

            // Sobrescribir res.json para cachear la respuesta
            res.json = (body) => {
                client.setex(key, ttl, JSON.stringify(body));
                originalJson.call(res, body);
            };

            next();
        } catch (err) {
            console.error('Redis error:', err);
            next(); // Continuar sin cache si hay error
        }
    };
};