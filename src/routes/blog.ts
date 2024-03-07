import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { createPostSchema , updatePostSchema} from '@mr-dash/mindmosaic-zod'


export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;

    },
    Variables: {
        userId: string;
    }

}>();

blogRouter.use("/*", async (c, next) => {
    const token = c.req.header('Authorization') || c.req.header('authorization') || '';
    if (!token) {
        c.status(401);
        return c.text('Unauthorized');
    }
    try {
       // console.log(c.env.JWT_SECRET);
        const verifyToken = await verify(token, c.env.JWT_SECRET);
        
        if (verifyToken) {

            c.set('userId', verifyToken.userId);
           // console.log(verifyToken);
            await next();
        }
        else {
            c.status(401);
            return c.text('UUnauthorized');
        }
    }
    catch (e) {
        c.status(401);
        return c.text('Unauthorized');
    }

});

blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const result = createPostSchema.safeParse(body);
    if (!result.success) {
        c.status(411);
        return c.json({
            message: 'Invalid input',
            errors: result.error
        });
    }
   
    const authorId = c.get('userId');
   
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                published: body.published || false,
                authorId: authorId
            }
        })

        return c.json({
            id: blog.id,
            title: blog.title
        });

    }
    catch (e) {
        //console.log(e);
        c.status(411);
        return c.text('Invalid input');

    }
    finally {
        await prisma.$disconnect()
    }
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const result = updatePostSchema.safeParse(body);
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
        const blog = await prisma.blog.update({
            where: {
                id: body.id
            },
            data: {
                title: body.title,
                content: body.content,
                published: body.published,
            }
        })

        return c.json({
            id: blog.id,
            title: blog.title
        });

    }
    catch (e) {
        console.log(e);
        c.status(411);
        return c.text('Invalid input');

    }
    finally {
        await prisma.$disconnect()
    }
})

blogRouter.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.delete({
            where: {
                id: id
            }
        })

        return c.json({
            id: blog.id,
            title: blog.title
        });

    }
    catch (e) {
        //console.log(e);
        c.status(411);
        return c.text('Invalid input');

    }
    finally {
        await prisma.$disconnect()
    }
})


blogRouter.get('/page/:num', async (c) => {
    // add [pagination, limit, offset, sort, filter, search]
    const page = Number(c.req.param('num')) || 1;
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())


    const limit = Number(body.limit) || 10;
    try {
        const blogs = await prisma.blog.findMany({
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                content: true,
                published: true
            }
        })
        if (blogs.length === 0) {
            c.status(404);
            return c.text('No blogs found on this page');
        }

        return c.json(blogs);
    }
    catch (e) {
        // console.log(e);
        c.status(411);
        return c.text('Invalid input');

    }
    finally {
        await prisma.$disconnect()
    }
})

blogRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.blog.findUnique({
            where: {
                id: id
            }
        })

        return c.json(blog);
    }
    catch (e) {
        c.status(411);
        return c.text('Invalid input');

    }
    finally {
        await prisma.$disconnect()
    }

})





