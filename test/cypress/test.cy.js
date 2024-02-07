const { describe } = require("node:test");

//テストデータ
const testData = [
  {
  customer_id : 1,
  company_name : 'テスト株式会社',
  industry : 'IT',
  contact : '03-1111-1111',
  location : '東京都新宿区',
  created_date : Date.now(),
  updated_date : Date.now()
  }
];


describe('顧客情報入力フォームのテスト', () => {
  it('顧客情報を入力して送信し、成功メッセージを確認する', () => {
    cy.visit('/nishi/customer/add.html'); // テスト対象のページにアクセス
    cy.window().then((win) => {
      // windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, 'alert').as('alertStub');
    });

    // テストデータの読み込み
    cy.fixture('customerData').then((data) => {
      // フォームの入力フィールドにテストデータを入力
      const uniqueContactNumber = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').type(data.companyName);
      cy.get('#industry').type(data.industry);
      cy.get('#contact').type(uniqueContactNumber);
      cy.get('#location').type(data.location);
    });

    // フォームの送信
    cy.get('#customer-form').submit();
  });
});


describe('顧客一覧画面と顧客詳細画面のテスト', () => {
  it('顧客一覧ページを表示し、会社名をクリックすると詳細画面に遷移する', () => {
    cy.intercept('GET', '/api_natsuki_fujii/customers', testData).as('customerData');
    cy.visit('/natsuki_fujii/customer/list.html'); // テスト対象のページにアクセス
    cy.wait('@customerData');

    cy.get('#customer-list tr').each(($row, index) => {
      //各セルにテストデータが入っているか確認
      cy.wrap($row).find('td').eq(0).should('contain', index + 1);
      cy.wrap($row).find('td').eq(1).should('contain', testData[0].company_name);
      cy.wrap($row).find('td').eq(2).should('contain', testData[0].contact);
    });

    cy.intercept('POST', '/api_natsuki_fujii/company', { success : true }).as('customerName');
    cy.get('a').click();
    cy.wait('@customerName');

    //詳細画面に遷移できているか確認
    cy.intercept('POST', '/api_natsuki_fujii/detail', { success : true, companyData : testData[0] }).as('customerDetail');
    cy.url().should('include', '/natsuki_fujii/customer/detail.html');
    cy.wait('@customerDetail');

    //各項目にテストデータが入っているか確認
    cy.get('#customer_id').should('contain', testData[0].customer_id);
    cy.get('#company_name').should('contain', testData[0].company_name);
    cy.get('#industry').should('contain', testData[0].industry);
    cy.get('#contact').should('contain', testData[0].contact);
    cy.get('#location').should('contain', testData[0].location);
    cy.get('#created_date').should('contain', testData[0].created_date);
    cy.get('#updated_date').should('contain', testData[0].updated_date);
  });
});
