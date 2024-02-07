const { describe, beforeEach } = require("node:test");

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
    // テスト対象のページにアクセス
    cy.visit('/nishi/customer/add.html'); 
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

      cy.intercept('POST', '/api_nishi/add-customer', { success: true, customer: data }).as('add');
    });

    // フォームの送信
    cy.get('#customer-form').submit();
    cy.wait('@add');
    cy.get('@alertStub').should('have.been.calledOnceWith', '顧客情報が正常に保存されました。');
  });
});


describe('顧客一覧画面と顧客詳細画面のテスト', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api_natsuki_fujii/customers', testData).as('customerData');
    cy.intercept('POST', '/api_natsuki_fujii/company', { success : true }).as('customerName');
    cy.intercept('POST', '/api_natsuki_fujii/detail', { success : true, companyData : testData[0] }).as('customerDetail');
    cy.intercept('POST', '/api_natsuki_fujii/delete-customer', { success: true }).as('deleteCustomer');
  });

  it('顧客一覧ページを表示し、会社名をクリックすると詳細画面に遷移する', () => {
    // テスト対象のページにアクセス
    cy.visit('/natsuki_fujii/customer/list.html'); 
    cy.wait('@customerData');

    cy.get('#customer-list tr').each(($row, index) => {
      //各セルにテストデータが入っているか確認
      cy.wrap($row).find('td').eq(0).should('contain', index + 1);
      cy.wrap($row).find('td').eq(1).should('contain', testData[0].company_name);
      cy.wrap($row).find('td').eq(2).should('contain', testData[0].contact);
    });

    //会社名をクリック
    cy.get('a').click();
    cy.wait('@customerName');
    cy.wait('@customerDetail');

    //詳細画面に遷移できているか確認
    cy.url().should('include', '/natsuki_fujii/customer/detail.html');
    
    //各項目にテストデータが入っているか確認
    cy.get('#customer_id').should('contain', testData[0].customer_id);
    cy.get('#company_name').should('contain', testData[0].company_name);
    cy.get('#industry').should('contain', testData[0].industry);
    cy.get('#contact').should('contain', testData[0].contact);
    cy.get('#location').should('contain', testData[0].location);
    cy.get('#created_date').should('contain', testData[0].created_date);
    cy.get('#updated_date').should('contain', testData[0].updated_date);
  });

  it('削除ボタンを押すと顧客が削除される', () => {
    // テスト対象のページにアクセス
    cy.visit('/natsuki_fujii/customer/detail.html');
    cy.wait('@customerDetail');

    //削除ボタンをクリック
    cy.get('#delete').click();

    //確認ダイアログでOKを選択
    cy.on('window:confirm', () => {
      return true;
    });
    cy.wait('@deleteCustomer');

    //一覧画面に遷移できているか確認
    cy.url().should('include', '/natsuki_fujii/customer/list.html');
  });
});


