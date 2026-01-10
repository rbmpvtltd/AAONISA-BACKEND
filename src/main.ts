// main.ts
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { join } from "path";
import { AppModule } from "./app.module";
import { Server } from "http";

function isPrivateHost(hostname: string) {
	if (!hostname) return false;
	if (hostname === "localhost" || hostname === "127.0.0.1") return true;

	const parts = hostname.split(".");
	if (parts.length !== 4) return false;

	const [a, b] = parts.map((p) => Number(p));
	if (Number.isNaN(a) || Number.isNaN(b)) return false;

	if (a === 10) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;

	return false;
}

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use((req, res, next) => {
		req.setTimeout(5 * 60 * 1000);
		res.setTimeout(5 * 60 * 1000);
		next();
	});

	app.use(bodyParser.json({ limit: "10mb" }));
	app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

	app.enableCors({
		origin: true,
		credentials: true,
	});

	app.use("/uploads", express.static(join(process.cwd(), "src", "uploads")));
	// .well-known serve
	app.use(
		"/.well-known",
		express.static(join(process.cwd(), "src", "well-known"), {
			setHeaders: (res, path) => {
				// Apple ke liye important
				if (path.endsWith("apple-app-site-association")) {
					res.setHeader("Content-Type", "application/json");
				}
			},
		})
	);
	app.use(cookieParser());
	app.setGlobalPrefix("api");

	const config = new DocumentBuilder()
		.setTitle("Demo API")
		.setDescription("API documentation for Demo project")
		.setVersion("1.0")
		.addTag("Demo")
		.build();

	const document = SwaggerModule.createDocument(app, config);
	if (process.env.NODE_ENV !== "production") {
		SwaggerModule.setup("api", app, document);
	}

	const port = Number(process.env.PORT ?? 3000);

	// ✅ IMPORTANT: server reference capture karo
	const server: Server = await app.listen(port, "0.0.0.0");

	// ✅ GRACEFUL SHUTDOWN → YAHI TERA MAIN FIX HAI
	const closeApp = async () => {
		console.log("🔥 Closing server properly...");
		await new Promise((resolve) => server.close(resolve));
		process.exit(0);
	};

	process.on("SIGTERM", closeApp);
	process.on("SIGINT", closeApp);
}

bootstrap();
