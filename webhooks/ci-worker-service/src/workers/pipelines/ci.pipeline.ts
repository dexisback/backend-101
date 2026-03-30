
import {prisma} from "../../db/prisma"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const runCIPipeline = async (buildId: string) => {
  let logs: string[] = [];

  try {
    await prisma.build.update({
      where: { id: buildId },
      data: { status: "RUNNING" },
    });

    const pushLog = async (msg: string) => {
      logs = [...logs, msg];
      await prisma.build.update({
        where: { id: buildId },
        data: { logs },
      });
    };

    await pushLog("Cloning repo...");
    await sleep(1000);
    await pushLog("Installing dependencies...");
    await sleep(1000);
    await pushLog("Running tests...");
    await sleep(1000);

    if (Math.random() < 0.3) {
      await pushLog("Tests failed ");
      await prisma.build.update({
        where: { id: buildId },
        data: { status: "FAILED", logs },
      });
      throw new Error("CI failed");
    }

    await pushLog("Tests passed ");
    await prisma.build.update({
      where: { id: buildId },
      data: { status: "SUCCESS", logs },
    });
  } catch (error) {
    await prisma.build.update({
      where: { id: buildId },
      data: { status: "FAILED", logs },
    }).catch(() => {}); // Silent fallback
    throw error;
  }
};