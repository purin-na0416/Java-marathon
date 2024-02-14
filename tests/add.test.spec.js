import { test, expect } from '@playwright/test';
import { request } from 'http';

test('test', async ({ page }) => {
  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/add.html');

  //フォーム入力
  await page.getByLabel('会社名:').click();
  await page.getByLabel('会社名:').fill('abc');
  await page.getByLabel('業種:').click();
  await page.getByLabel('業種:').fill('IT');
  await page.getByLabel('連絡先:').click();
  await page.getByLabel('連絡先:').fill('03-1111-1111');
  await page.getByLabel('所在地:').click();
  await page.getByLabel('所在地:').fill('東京都新宿区');

  //入力したデータとテストデータを取得
  const formData = [
    {
    customerId : 1,  
    companyName: await page.$eval('input#companyName', el => el.value),
    industry: await page.$eval('input#industry', el => el.value),
    contact: await page.$eval('input#contact', el => el.value),
    location: await page.$eval('input#location', el => el.value),
    createdDate : Date.now(),
    updatedDate : Date.now()
    }
  ];

  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/confirm', (route, request) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  await page.getByRole('button', { name: '送信' }).click();
  
  await page.route('/api_natsuki_fujii/add-customer', (route, request) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true, customer: formData[0] })
    });
  });

  //確認ページ
  await page.getByRole('button', { name: 'はい' }).click();

  await page.evaluate(() => alert('顧客情報が正常に保存されました。'));
});