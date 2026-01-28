import { Injectable } from '@nestjs/common';
import { PrismaClient, UserAlbumHistory } from '@soundx/db';

@Injectable()
export class UserAlbumHistoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: UserAlbumHistory) {
    return await this.prisma.userAlbumHistory.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.userAlbumHistory.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.userAlbumHistory.findUnique({
      where: { id },
    });
  }

  async remove(id: number) {
    return await this.prisma.userAlbumHistory.delete({
      where: { id },
    });
  }

  async getUserAlbumHistoryTableList(pageSize: number, current: number) {
    return await this.prisma.userAlbumHistory.findMany({
      skip: (current - 1) * pageSize,
      take: pageSize,
    });
  }

  async loadMoreUserAlbumHistory(pageSize: number, loadCount: number, userId: number, type?: string) {
    const list = await this.prisma.userAlbumHistory.findMany({
      where: { 
        userId,
        album: type ? { type: type as any } : undefined,
      },
      orderBy: {
        // 按 albumId 分组后，每组按 listenedAt 最大值排序
        listenedAt: 'desc',
      },

      // 每个 albumId 只保留最新一条
      distinct: ['albumId'],

      skip: loadCount * pageSize,
      take: pageSize,

      include: {
        album: true, // 带出专辑信息
      },
    });

    // Attach resume progress for each album
    const listWithResume = await Promise.all(list.map(async (item) => {
      if (!item.album) return item;
      
      const lastHistory = await this.prisma.userAudiobookHistory.findFirst({
        where: {
          userId,
          track: {
            albumId: item.albumId,
          },
        },
        orderBy: {
          listenedAt: 'desc',
        },
        select: {
          trackId: true,
          progress: true,
        },
      });

      if (lastHistory) {
        (item.album as any).resumeTrackId = lastHistory.trackId;
        (item.album as any).resumeProgress = lastHistory.progress;
      }
      
      return item;
    }));

    return listWithResume;
  }


  async userAlbumHistoryCount(userId?: number) {
    if (userId) {
      // Count unique albums for the user
      const uniqueAlbums = await this.prisma.userAlbumHistory.groupBy({
        by: ['albumId'],
        where: { userId },
      });
      return uniqueAlbums.length;
    }
    return await this.prisma.userAlbumHistory.count();
  }
}
