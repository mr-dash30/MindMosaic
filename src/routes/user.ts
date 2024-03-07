import { Hono } from 'hono'; 
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import z from 'zod';
import { signupSchema } from '../zod';


export const userRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string;
		JWT_SECRET: string;

	};

}>();

userRouter.post('/signup', async(c) => {
	console.log(c.req);
	const body = await c.req.json();
    const result = signupSchema.safeParse(body);
    if (!result.success) {
        c.status(411);
        return c.json({
            message: 'Invalid input',
            errors: result.error
        });
    }
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	try {
		const user = await prisma.user.create({
			data: {
				username: body.username,
				name : body.name? body.name : null,
				email: body.email,
				password: body.password,
			}
		})
		const token = await sign({
			userId: user.id,
			username: user.username,
		}, c.env.JWT_SECRET)

		c.status(201);
		
		return c.json({
			token,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				name: user.name,
			}
		})




	}
	catch (e) {
		c.status(411);
		return c.text('Invalid input');
		console.log(e);
	}
	finally {
		await prisma.$disconnect()
	}
	
})

userRouter.post('/signin', async(c) => {
	const body = await c.req.json();
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	try {
		const user = await prisma.user.findFirst({
			where: {
				username: body.username || body.email,
				password: body.password
			}
		})
		if (!user) {
			c.status(401);
			return c.json({
				message: 'Invalid username or password'
				});
		}
		const token = await sign({
			userId: user.id,
			username: user.username,
		}, c.env.JWT_SECRET)

		c.status(201);
		
		return c.json({
			token,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				name: user.name,
			}
		})




	}
	catch (e) {
		c.status(411);
		return c.text('Invalid input');
		console.log(e);
	}
	finally {
		await prisma.$disconnect()
	}
})