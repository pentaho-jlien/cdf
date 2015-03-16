/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(["cdf/Dashboard.Clean", "cdf/components/ExecuteXactionComponent"],
  function(Dashboard, ExecuteXactionComponent) {

  /**
   * ## The Execute Xaction Component
   */
  describe("The Execute Xaction Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var executeXactionComponent = new ExecuteXactionComponent(dashboard, {
      name: "executeTopTenCustomers",
      type: "executeXaction",
      path: "/public/plugin-samples/pentaho-cdf/20-samples/home_dashboard/topTenCustomers.xaction",
      listeners:["productLineParam", "territoryParam"],
      parameters: [["productLine", "productLineParam"], ["territory", "territoryParam"]],
      htmlObject: "sampleObject",
      label: "Execute XAction",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      tooltip: "My first dashboard"
    });

    dashboard.addComponent(executeXactionComponent);

    /**
     * ## The Execute Xaction Component # Update Called
     */
    it("Update Called", function(done) {
      spyOn(executeXactionComponent, 'update').and.callThrough();
      dashboard.update(executeXactionComponent);
      setTimeout(function() {
        expect(executeXactionComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
