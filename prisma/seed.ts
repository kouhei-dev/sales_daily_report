/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, ReportStatus, CommentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 本番環境での誤実行を防止
 */
function checkEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const allowSeed = process.env.ALLOW_SEED;

  if (nodeEnv === 'production' && allowSeed !== 'true') {
    console.error('❌ ERROR: Seeding is not allowed in production environment!');
    console.error('If you really want to seed in production, set ALLOW_SEED=true');
    process.exit(1);
  }

  console.log(`🌱 Seeding database in ${nodeEnv || 'development'} environment...`);
}

/**
 * パスワードをハッシュ化
 */
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * 所属部署マスタのシードデータを投入
 */
async function seedDepartments() {
  console.log('🏢 Seeding Department data...');

  const dept1 = await prisma.department.upsert({
    where: { departmentName: '営業1課' },
    update: {},
    create: {
      departmentName: '営業1課',
      displayOrder: 1,
    },
  });

  const dept2 = await prisma.department.upsert({
    where: { departmentName: '営業2課' },
    update: {},
    create: {
      departmentName: '営業2課',
      displayOrder: 2,
    },
  });

  const dept3 = await prisma.department.upsert({
    where: { departmentName: '営業3課' },
    update: {},
    create: {
      departmentName: '営業3課',
      displayOrder: 3,
    },
  });

  const dept4 = await prisma.department.upsert({
    where: { departmentName: '営業4課' },
    update: {},
    create: {
      departmentName: '営業4課',
      displayOrder: 4,
    },
  });

  console.log('✅ Department data seeded successfully');
  return { dept1, dept2, dept3, dept4 };
}

/**
 * 営業マスタのシードデータを投入
 */
async function seedSales(departments: { dept1: any; dept2: any }) {
  console.log('📊 Seeding Sales data...');

  // マネージャー1: 山田太郎
  const manager1 = await prisma.sales.upsert({
    where: { salesCode: 'MGR001' },
    update: {},
    create: {
      salesCode: 'MGR001',
      salesName: '山田太郎',
      email: 'yamada@example.com',
      passwordHash: await hashPassword('password123'),
      departmentId: departments.dept1.id,
      isManager: true,
    },
  });

  // 営業1: 佐藤花子
  const sales1 = await prisma.sales.upsert({
    where: { salesCode: 'S001' },
    update: {},
    create: {
      salesCode: 'S001',
      salesName: '佐藤花子',
      email: 'sato@example.com',
      passwordHash: await hashPassword('password123'),
      departmentId: departments.dept1.id,
      isManager: false,
      managerId: manager1.id,
    },
  });

  // 営業2: 鈴木一郎
  const sales2 = await prisma.sales.upsert({
    where: { salesCode: 'S002' },
    update: {},
    create: {
      salesCode: 'S002',
      salesName: '鈴木一郎',
      email: 'suzuki@example.com',
      passwordHash: await hashPassword('password123'),
      departmentId: departments.dept2.id,
      isManager: false,
    },
  });

  // マネージャー2: 田中次郎
  const manager2 = await prisma.sales.upsert({
    where: { salesCode: 'MGR002' },
    update: {},
    create: {
      salesCode: 'MGR002',
      salesName: '田中次郎',
      email: 'tanaka@example.com',
      passwordHash: await hashPassword('password123'),
      departmentId: departments.dept2.id,
      isManager: true,
    },
  });

  // 鈴木一郎のマネージャーを田中次郎に設定
  await prisma.sales.update({
    where: { id: sales2.id },
    data: { managerId: manager2.id },
  });

  console.log('✅ Sales data seeded successfully');
  return { manager1, sales1, sales2, manager2 };
}

/**
 * 顧客マスタのシードデータを投入
 */
async function seedCustomers(sales: { sales1: any; sales2: any }) {
  console.log('🏢 Seeding Customer data...');

  const customer1 = await prisma.customer.upsert({
    where: { customerCode: 'C001' },
    update: {},
    create: {
      customerCode: 'C001',
      customerName: 'A株式会社',
      industry: '製造業',
      phone: '03-1234-5678',
      salesId: sales.sales1.id,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerCode: 'C002' },
    update: {},
    create: {
      customerCode: 'C002',
      customerName: 'B株式会社',
      industry: 'IT',
      phone: '03-2345-6789',
      salesId: sales.sales1.id,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { customerCode: 'C003' },
    update: {},
    create: {
      customerCode: 'C003',
      customerName: 'C商事',
      industry: 'サービス',
      phone: '06-3456-7890',
      salesId: sales.sales2.id,
    },
  });

  console.log('✅ Customer data seeded successfully');
  return { customer1, customer2, customer3 };
}

/**
 * 日報サンプルデータを投入（過去1週間分）
 */
async function seedDailyReports(
  sales: { sales1: any; sales2: any },
  customers: { customer1: any; customer2: any; customer3: any }
) {
  console.log('📝 Seeding Daily Report data...');

  const today = new Date();
  const reports = [];

  // 過去7日分の日報を作成
  for (let i = 0; i < 7; i++) {
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - i);
    reportDate.setHours(0, 0, 0, 0);

    // 佐藤花子の日報
    const report1 = await prisma.dailyReport.upsert({
      where: {
        unique_sales_report_date: {
          salesId: sales.sales1.id,
          reportDate: reportDate,
        },
      },
      update: {},
      create: {
        salesId: sales.sales1.id,
        reportDate: reportDate,
        problem: i % 2 === 0 ? `${i + 1}日前の課題: 新規顧客開拓が進んでいません` : null,
        plan: i % 2 === 0 ? `${i + 1}日前の計画: 既存顧客へのフォローアップを強化します` : null,
        status: i < 2 ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
        submittedAt: i < 2 ? new Date(reportDate.getTime() + 18 * 60 * 60 * 1000) : null,
      },
    });

    // 訪問記録を1〜3件追加
    const visitCount = Math.min((i % 3) + 1, 3);
    for (let j = 0; j < visitCount; j++) {
      const visitDatetime = new Date(reportDate);
      visitDatetime.setHours(10 + j * 2, 0, 0, 0);

      const customerId = j === 0 ? customers.customer1.id : customers.customer2.id;

      await prisma.visitRecord.create({
        data: {
          reportId: report1.id,
          customerId: customerId,
          visitDatetime: visitDatetime,
          visitContent: `訪問内容${j + 1}: 製品の提案と見積もりの提出`,
          visitResult: j % 2 === 0 ? `訪問結果${j + 1}: 好感触、次回アポイント取得` : null,
          displayOrder: j,
        },
      });
    }

    reports.push(report1);

    // 鈴木一郎の日報（3日に1回）
    if (i % 3 === 0) {
      const report2 = await prisma.dailyReport.upsert({
        where: {
          unique_sales_report_date: {
            salesId: sales.sales2.id,
            reportDate: reportDate,
          },
        },
        update: {},
        create: {
          salesId: sales.sales2.id,
          reportDate: reportDate,
          problem: null,
          plan: `${i + 1}日前の計画: C商事との契約交渉を進めます`,
          status: i < 2 ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
          submittedAt: i < 2 ? new Date(reportDate.getTime() + 17 * 60 * 60 * 1000) : null,
        },
      });

      // 訪問記録を1件追加
      const visitDatetime = new Date(reportDate);
      visitDatetime.setHours(14, 0, 0, 0);

      await prisma.visitRecord.create({
        data: {
          reportId: report2.id,
          customerId: customers.customer3.id,
          visitDatetime: visitDatetime,
          visitContent: '契約条件の確認と調整',
          visitResult: '価格交渉継続中',
          displayOrder: 0,
        },
      });

      reports.push(report2);
    }
  }

  console.log('✅ Daily Report data seeded successfully');
  return reports;
}

/**
 * コメントサンプルデータを投入
 */
async function seedComments(reports: any[], managers: { manager1: any; manager2: any }) {
  console.log('💬 Seeding Comment data...');

  // 最新の2件の日報にコメントを追加
  const submittedReports = reports.filter((r) => r.status === ReportStatus.SUBMITTED).slice(0, 2);

  for (const report of submittedReports) {
    // 課題へのコメント
    if (report.problem) {
      await prisma.comment.create({
        data: {
          reportId: report.id,
          commenterId: managers.manager1.id,
          commentType: CommentType.PROBLEM,
          commentText: '新規顧客開拓については、マーケティング部門と連携して進めてください。',
          isRead: false,
        },
      });
    }

    // 計画へのコメント
    if (report.plan) {
      await prisma.comment.create({
        data: {
          reportId: report.id,
          commenterId: managers.manager1.id,
          commentType: CommentType.PLAN,
          commentText: 'フォローアップの頻度を上げることで、顧客満足度向上につながると思います。',
          isRead: false,
        },
      });
    }
  }

  console.log('✅ Comment data seeded successfully');
}

/**
 * メイン処理
 */
async function main() {
  try {
    checkEnvironment();

    // 既存データのクリーンアップ（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Cleaning up existing data...');
      await prisma.comment.deleteMany();
      await prisma.visitRecord.deleteMany();
      await prisma.dailyReport.deleteMany();
      await prisma.customer.deleteMany();

      // 自己参照リレーションがあるため、先にmanagerIdをnullに設定
      await prisma.sales.updateMany({
        data: { managerId: null },
      });
      await prisma.sales.deleteMany();

      await prisma.department.deleteMany();
      console.log('✅ Cleanup completed');
    }

    const departmentData = await seedDepartments();
    const salesData = await seedSales({
      dept1: departmentData.dept1,
      dept2: departmentData.dept2,
    });
    const customerData = await seedCustomers({
      sales1: salesData.sales1,
      sales2: salesData.sales2,
    });
    const reports = await seedDailyReports(salesData, customerData);
    await seedComments(reports, {
      manager1: salesData.manager1,
      manager2: salesData.manager2,
    });

    console.log('🎉 All seed data inserted successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('  - Departments: 4 records');
    console.log('  - Sales: 4 records (2 managers, 2 staff)');
    console.log('  - Customers: 3 records');
    console.log(`  - Daily Reports: ${reports.length} records`);
    console.log('  - Visit Records: Multiple records');
    console.log('  - Comments: Added to recent submitted reports');
    console.log('');
    console.log('🔑 Default password for all users: password123');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
