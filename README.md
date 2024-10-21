# @kristall/http

HTTP methods for supporting NextJS Server Actions of [Kristall](https://kristall.app)

## Features

- Server Action by default ("use server")
- Typescript support
- NextJS tags support for revalidation

## Installation

```bash
npm install @kristall/http

pnpm add @kristall/http

yarn add @kristall/http
```

### How it works

#### Where is the request made?

You will define the server that will handle the request in your .env file using the SERVER_API variable.

Example:

```bash
SERVER_API="http://localhost:3000"
```

#### Cookies

The package uses the `next/headers` package to get the access token from the cookies and add it to the headers of the request to the server. The cookie must be named `session`.

The cookie is add to the headers of the request with the following structure:

```ts
{
	Authorization: `Bearer ${access_token}`,
	Cookie: `session=${access_token}`,
	"Content-Type": "application/json",
}
```

#### Tags

You can add tags to your server actions to revalidate them. The tags are added to the `next` object of the response. The tags is an array of strings.

## Usage

Import the method you need from the package:

```ts
import { GET, POST, PATCH, PUT, DELETE } from "@kristall/http";
```

### GET

You can use the `GET` method to fetch data from the server.

```ts
import { GET } from "@kristall/http";

// Your own types
import type { Product } from "@/types/product";

export const getProducts = async (): Promise<Product[]> => {
	const { data } = await GET<Product[]>("/products", {
        // Setting the tags
		tags: ["products"],
	});
	return data;
};
```

We also check if the tags is not provided sending a warning to the console on `development` mode and will tell you the path of the untagged server action.
```bash
⚠️ No tags provided for GET request: /products
```

If a response status is not ok like `400` or `500` the response will throw an error with the message of the response and will show on the console on `development` mode the path of the server action that failed.

```bash
❌ Error fetching data at:  /products
```

### POST

You can use the `POST` method to send data to the server.

```ts
import type { Product } from "@/types/product";

const product: Product = {
    id: 1,
    name: "Product 1",
}

const response = await POST<Product, Product[]>("/products", product);
```

POST can receive two types of parameters:

- The first one is the body of the request.
- The second one is the response type.

If you don't need to receive the response type, you can use the `POST` method without the second parameter and by default it will be `unknown`.

### PATCH / PUT

PATCH and PUT have the same api as POST, but they are used to update data on the server, use as you prefer.

### DELETE

You can use the `DELETE` method to delete data from the server.

```ts
const response = await DELETE("/products/1");
```

DELETE doesn't need a extra parameters. Only need the url of the resource.

## Considerations

#### Response

By default `ALL` methods are typed to return a `ServerResponse` object with the following structure **BUT WE DON'T CHECK IT** so it may cause errors with the response of your server:

```ts
interface ServerResponse<T> {
	message: string;
	data: T;
	status: number;
}
```

#### Errors

If a response status is not ok like `400` or `500` the response will throw an error with the message of the response.