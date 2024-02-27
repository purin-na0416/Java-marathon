import { test, expect } from '@playwright/test';

//テストデータ
const testData = [
  {
  customer_id : 1,  
  company_name: 'テスト株式会社',
  industry: 'IT',
  contact: '03-1111-1111',
  location: '東京都新宿区',
  created_date : Date.now(),
  updated_date : Date.now()
  }
];
const data = { success: true, companyData: testData[0] };
const selecterList = ['#customer_id', '#company_name', '#industry', '#contact', '#location', '#created_date', '#updated_date'];

test('顧客情報入力フォームのテスト', async ({ page }) => {
  //テスト対象ページに移動
  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/add.html');

  //フォーム入力
  await page.getByLabel('会社名:').click();
  await page.getByLabel('会社名:').fill(testData[0].company_name);
  await page.getByLabel('業種:').click();
  await page.getByLabel('業種:').fill(testData[0].industry);
  await page.getByLabel('連絡先:').click();
  await page.getByLabel('連絡先:').fill(testData[0].contact);
  await page.getByLabel('所在地:').click();
  await page.getByLabel('所在地:').fill(testData[0].location);

  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/confirm', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  //送信ボタンをクリック
  await page.getByRole('button', { name: '送信' }).click();
  
  await page.route('/api_natsuki_fujii/add-customer', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true, customer: testData[0] })
    });
  });

  //確認ページ
  await page.getByRole('button', { name: 'はい' }).click();

  await page.evaluate(() => alert('顧客情報が正常に保存されました。'));
});


test('顧客一覧ページを表示し、会社名をクリックすると詳細画面に遷移する', async ({ page }) => {
  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/customers', (route) => {
    route.fulfill({
      method: 'GET',
      contentType: 'application/json',
      body: JSON.stringify(testData)
    });
  });

  //テスト対象ページに移動
  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/list.html');

  //一覧にデータが正しく反映されているか確認
  const customerList = await page.$$('#customer-list tr');
  let i = 1;
  for(const tr of customerList) {
    const cells = await tr.$$('td');

    const index = await cells[0].textContent();
    expect(index).toBe(i.toString());

    const companyName = await cells[1].textContent();
    expect(companyName).toBe(testData[0].company_name);

    const contact = await cells[2].textContent();
    expect(contact).toBe(testData[0].contact);

    i++;
  }

  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/company', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });

  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/detail', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(data)
    }); 
  });

  //会社名をクリック
  await page.getByRole('link', { name: testData[0].company_name }).click();

  //遷移先のページに移動
  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/detail.html');
  await expect(page).toHaveURL('http://dev.marathon.rplearn.net/natsuki_fujii/customer/detail.html');

  //データが正しく反映されているか確認
  for(let i = 0; i < selecterList.length; i++) {
    const elements = await page.$$(selecterList[i]);
    const element = await elements[0].textContent();
    expect(element).toBe(Object.values(testData[0])[i].toString());
  }
});


test('削除ボタンを押すと顧客が削除される', async ({ page }) => {
  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/detail', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify(data)
    }); 
  });

  //テスト対象ページに移動
  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/detail.html');

  //データが正しく反映されているか確認
  for(let i = 0; i < selecterList.length; i++) {
    const elements = await page.$$(selecterList[i]);
    const element = await elements[0].textContent();
    expect(element).toBe(Object.values(testData[0])[i].toString());
  }

  //削除ボタンをクリック
  await page.getByRole('button', { name: '削除' }).click();

  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/delete-customer', (route) => {
    route.fulfill({
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  })

  await page.evaluate(() => {
    confirm('削除していいですか？');
  });

  //確認ダイアログでOKをクリック
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  //一覧画面に戻る
  await page.route('http://dev.marathon.rplearn.net/api_natsuki_fujii/customers', (route) => {
    route.fulfill({
      method: 'GET',
      contentType: 'application/json',
      body: JSON.stringify(testData)
    });
  });

  await page.goto('http://dev.marathon.rplearn.net/natsuki_fujii/customer/list.html');
  await expect(page).toHaveURL('http://dev.marathon.rplearn.net/natsuki_fujii/customer/list.html');
});  

