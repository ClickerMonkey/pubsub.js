
/**
 *
 */
function IdMap()
{
  this.size = 0;
  this.items = {};
}

IdMap.prototype = 
{
  
  /**
   *
   * @param object item
   * @param any itemToAdd
   */
  add: function(item, itemToAdd)
  {
    var added = !(item.id in this.items);
    
    if (added)
    {
      this.items[ item.id ] = itemToAdd || item;
      this.size++;
    }
    
    return added;
  },
  
  /**
   *
   * @param string id
   */
  at: function(id)
  {
    return this.items[ id ];
  },
  
  /**
   *
   * @param object item
   */
  remove: function(item)
  {
    var removed = (item.id in this.items);
    
    if (removed)
    {
      delete this.items[ item.id ];
      this.size--;
    }
    
    return removed;
  },
  
  /**
   * 
   * @param object item
   */
  take: function(item)
  {
    var taken = this.items[ item.id ];
    this.remove( item );
    return taken;
  },
  
  /**
   * 
   * @param object item
   */
  has: function(item)
  {
    return ( item.id in this.items );
  },
  
  /**
   * 
   * @param string skipId
   * @param any context
   * @param function callback
   */
  each: function(skipId, context, callback)
  {    
    for (var id in this.items)
    {
      if (id !== skipId)
      {
        callback.call( context, id, this.items[id] );
      }
    }
  }
  
};

module.exports = IdMap;